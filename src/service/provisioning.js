import logger from '../utils/logger';
import Promise from 'bluebird';
import { AlreadyInUseError } from 'common-errors';
import Provisioning, {
  ProcessStatus,
  Capabilities,
  ServiceTypes,
  PaymentModes,
} from '../models/Provisioning';
import Joi from 'joi';
import _ from 'lodash';

// @todo to be verified on requirement
const REGEX_NUMBER_LETTERS_ONLY = /[a-zA-Z0-9]+/;
const REGEX_MONGO_OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export default function provisioningService(provisioningProcessor, validator) {
  // init provisioning process
  const { run, setCompleteHandler } = provisioningProcessor;

  function parseResultsToProfileUpdates(taskResults) {
    const provisioningInterestedFields = ['companyId', 'carrierId'];
    const profileUpdates = {};

    _.forEach(provisioningInterestedFields, (field) => {
      _.forEach(taskResults, (taskResult) => {
        if (!taskResult[field]) return;

        profileUpdates[`profile.${field}`] = taskResult[field];
      });
    });

    return profileUpdates;
  }

  /**
   * Upon process for provisioning complete, record results
   */
  setCompleteHandler(({ ownerId: provisioningId, taskResults = {}, taskErrors = {} }) => {
    // mark provisioning status as error if any error happened during process
    const status = Object.keys(taskErrors).length > 0 ? ProcessStatus.ERROR : ProcessStatus.COMPLETE;
    const profileUpdates = parseResultsToProfileUpdates(taskResults);

    logger(`Process complete for Provisioing: ${provisioningId}, profile changes `, profileUpdates);

    Provisioning.findByIdAndUpdate(provisioningId, _.extend({ taskResults, taskErrors, status }, profileUpdates))
      .exec();
  });

  const schemaCreateProvision = Joi.object({
    companyInfo: Joi.object({
      name: Joi.string().required(),
      description: Joi.string(),
      // @todo validate on timezone
      timezone: Joi.string(),
      address: Joi.string(),
      // @todo unclear on contact
      contact: Joi.string(),
    }),
    country: Joi.string().required(),
    companyCode: Joi.string().regex(REGEX_NUMBER_LETTERS_ONLY).required(),
    serviceType: Joi.string().valid(Object.values(ServiceTypes)),
    resellerCarrierId: Joi.string().required(),
    capabilities: Joi.array().items(Joi.string().valid(Capabilities)).unique().required(),
    paymentMode: Joi.string().required().valid(PaymentModes),
  });

  async function createProvisioning(command) {
    const profile = validator.sanitize(command, schemaCreateProvision);

    const provisioning = await Provisioning.create({
      profile,
    });

    const processId = await run(provisioning.id, profile);

    provisioning.processId = processId;
    provisioning.status = ProcessStatus.IN_PROGRESS;
    await provisioning.save();

    return { provisioningId: provisioning.id, createdAt: provisioning.createdAt };
  }

  const schemaGetProvisioning = Joi.object({
    provisioningId: Joi.string().regex(REGEX_MONGO_OBJECT_ID),
  });

  async function getProvisioning(command) {
    const sanitizedCommand = validator.sanitize(command, schemaGetProvisioning);
    return await Provisioning.findById(sanitizedCommand.provisioningId).exec();
  }

  const schemaGetProvisionings = Joi.object({
    provisioningId: Joi.array().items(Joi.string().regex(REGEX_MONGO_OBJECT_ID)).optional(),
    serviceType: Joi.array().items(Joi.string().valid(Object.values(ServiceTypes))).optional(),
    companyCode: Joi.array().items(Joi.string().regex(REGEX_NUMBER_LETTERS_ONLY)).optional(),
    companyId: Joi.array().items(Joi.string().regex(REGEX_MONGO_OBJECT_ID)).optional(),
    page: Joi.number().min(1).default(1),
    pageSize: Joi
      .number()
      .min(5).max(50)
      .default(10),
  });

  async function getProvisionings(command) {
    const {
      page,
      pageSize,
      serviceType,
      companyCode,
      companyId,
      provisioningId,
    } = validator.sanitize(command, schemaGetProvisionings);
    const offset = (page - 1) * pageSize;

    const filters = {};
    if (provisioningId) filters._id = { $in: provisioningId };
    if (companyCode) filters['profile.companyCode'] = { $in: companyCode };
    if (serviceType) filters['profile.serviceType'] = { $in: serviceType };
    if (companyId) filters['profile.companyId'] = { $in: companyId };

    const query = Provisioning.find(filters)
      .skip(offset)
      .limit(pageSize)
      .select({ taskResults: 1, status: 1, profile: 1 })
      .sort({ createdAt: -1 });

    // count() ignores skip() and limits() by default
    const result = await Promise.props({
      items: query.exec(),
      count: query.count(),
    });
    const pageTotal = Math.ceil(result.count / pageSize);

    return {
      page,
      pageSize,
      pageTotal,
      total: result.count,
      items: result.items,
    };
  }

  const schemaUpdateProvisionings = Joi.object({
    provisioningId: Joi.string().regex(REGEX_MONGO_OBJECT_ID),
    // only fields that are allowed to update after creation
    profile: Joi.object({
      country: Joi.string().optional(),
      companyCode: Joi.string().regex(REGEX_NUMBER_LETTERS_ONLY).optional(),
      serviceType: Joi.string().valid(Object.values(ServiceTypes)).optional(),
      capabilities: Joi.array().items(Joi.string().valid(Capabilities)).unique().optional(),
      paymentMode: Joi.string().required().valid(PaymentModes).optional(),
    }),
  });

  async function updateProvisioning(command) {
    const { provisioingId, profile } = validator.sanitize(command, schemaUpdateProvisionings);

    const provisioning = await Provisioning.findById(provisioingId);
    const { id: provisioningId, status, taskResults } = provisioning;

    if (status !== ProcessStatus.COMPLETE ||
      status !== ProcessStatus.ERROR) {
      throw new AlreadyInUseError(`Cannot update provisioning when status is ${status}`, 'RetryOnErrorOrCompleteOnly');
    }

    const processId = await run(provisioingId, profile, taskResults);

    return await Provisioning.findByIdAndUpdate(provisioningId, {
      status: ProcessStatus.UPDATING,
      process: processId,
      profile,
    }).exec();
  }

  return {
    createProvisioning,
    getProvisioning,
    getProvisionings,
    updateProvisioning,
  };
}
