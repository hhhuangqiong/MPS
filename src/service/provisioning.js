import logger from '../utils/logger';
import Promise from 'bluebird';
import { InvalidOperationError, NotFoundError } from 'common-errors';
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

const PUBLIC_PROPS = ['id', 'profile', 'status', 'taskErrors', 'createdAt', 'updatedAt'];

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
    resellerCompanyId: Joi.string().required().regex(REGEX_MONGO_OBJECT_ID),
    resellerCarrierId: Joi.string().required(),
    capabilities: Joi.array()
      .items(Joi.string().valid(Object.values(Capabilities)))
      .unique()
      .required(),
    paymentMode: Joi.string().required().valid(PaymentModes),
    billing: Joi.object({
      smsPackageId: Joi.number().min(0),
      offnetPackageId: Joi.number().min(0),
      currency: Joi.number().min(0).required(),
    }).required(),
    smsc: Joi.object({
      needBilling: Joi.boolean().required(),
      defaultRealm: Joi.string().required(),
      servicePlanId: Joi.string().required(),
      sourceAddress: Joi.string().required(),
    }).required(),
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

    return _.pick(provisioning, PUBLIC_PROPS);
  }

  const schemaGetProvisioning = Joi.object({
    provisioningId: Joi.string().regex(REGEX_MONGO_OBJECT_ID),
  });

  async function getProvisioning(command) {
    const sanitizedCommand = validator.sanitize(command, schemaGetProvisioning);
    return await Provisioning.findById(sanitizedCommand.provisioningId).exec();
  }

  const schemaGetProvisionings = Joi.object({
    carrierId: Joi.array().items(Joi.string()).optional(),
    provisioningId: Joi.array().items(Joi.string().regex(REGEX_MONGO_OBJECT_ID)).optional(),
    serviceType: Joi.array().items(Joi.string().valid(Object.values(ServiceTypes))).optional(),
    companyCode: Joi.array().items(Joi.string().regex(REGEX_NUMBER_LETTERS_ONLY)).optional(),
    companyId: Joi.array().items(Joi.string().regex(REGEX_MONGO_OBJECT_ID)).optional(),
    resellerCarrierId: Joi.array().items(Joi.string()).optional(),
    resellerCompanyId: Joi.array().items(Joi.string().regex(REGEX_MONGO_OBJECT_ID)).optional(),
    search: Joi.string(),
    page: Joi.number().min(1).default(1),
    pageSize: Joi
      .number()
      .min(5).max(50)
      .default(10),
  });

  async function getProvisionings(command) {
    if (command.provisioningId) command.provisioningId = command.provisioningId.split(',');
    if (command.companyId) command.companyId = command.companyId.split(',');
    if (command.serviceType) command.serviceType = command.serviceType.split(',');
    if (command.companyCode) command.companyCode = command.companyCode.split(',');
    if (command.carrierId) command.carrierId = command.carrierId.split(',');
    if (command.resellerCarrierId) command.resellerCarrierId = command.resellerCarrierId.split(',');
    if (command.resellerCompanyId) command.resellerCompanyId = command.resellerCompanyId.split(',');

    const {
      page,
      pageSize,
      search,
      serviceType,
      companyCode,
      companyId,
      provisioningId,
      carrierId,
      resellerCarrierId,
      resellerCompanyId,
    } = validator.sanitize(command, schemaGetProvisionings);

    const offset = (page - 1) * pageSize;
    const filters = {};
    /* eslint-disable no-underscore-dangle */
    if (provisioningId) filters._id = { $in: provisioningId };
    /* eslint-disable no-underscore-dangle */

    if (search) {
      filters['profile.companyCode'] = { $regex: new RegExp(`.*${search}.*`) };
    } else if (companyCode) {
      filters['profile.companyCode'] = { $in: companyCode };
    }

    if (serviceType) filters['profile.serviceType'] = { $in: serviceType };
    if (companyId) filters['profile.companyId'] = { $in: companyId };
    if (carrierId) filters['profile.carrierId'] = { $in: carrierId };
    if (resellerCarrierId) filters['profile.resellerCarrierId'] = { $in: resellerCarrierId };
    if (resellerCompanyId) filters['profile.resellerCompanyId'] = { $in: resellerCompanyId };

    const selection = _.transform(PUBLIC_PROPS, (result, prop) => {
      result[prop] = 1;
    }, {});
    const query = Provisioning.find(filters)
      .skip(offset)
      .limit(pageSize)
      .select(selection)
      .sort({ createdAt: -1 });

    // count() ignores skip() and limits() by default
    const result = await Promise.props({
      items: query.exec(),
      count: Provisioning.find(filters).count(),
    });
    const pageTotal = Math.ceil(result.count / pageSize);

    const items = result.items;
    return {
      page,
      pageSize,
      pageTotal,
      total: result.count,
      items,
    };
  }

  const schemaUpdateProvisionings = Joi.object({
    provisioningId: Joi.string().regex(REGEX_MONGO_OBJECT_ID).required(),
    // only fields that are allowed to update after creation
    profile: Joi.object({
      companyInfo: Joi.object({
        name: Joi.string(),
        description: Joi.string(),
        // @todo validate on timezone
        timezone: Joi.string(),
        address: Joi.string(),
        // @todo unclear on contact
        contact: Joi.string(),
      }),
      country: Joi.string(),
      companyCode: Joi.string().regex(REGEX_NUMBER_LETTERS_ONLY),
      serviceType: Joi.string().valid(Object.values(ServiceTypes)),
      resellerCompanyId: Joi.string().regex(REGEX_MONGO_OBJECT_ID),
      resellerCarrierId: Joi.string(),
      capabilities: Joi.array()
        .items(Joi.string().valid(Object.values(Capabilities)))
        .unique(),
      paymentMode: Joi.string().valid(PaymentModes),
      billing: Joi.object({
        smsPackageId: Joi.number().min(0),
        offnetPackageId: Joi.number().min(0),
        currency: Joi.number().min(0),
      }),
      smsc: Joi.object({
        needBilling: Joi.boolean(),
        defaultRealm: Joi.string(),
        servicePlanId: Joi.string(),
        sourceAddress: Joi.string(),
      }),
    }).required(),
  });

  async function updateProvisioning(command) {
    const { provisioningId, profile } = validator.sanitize(command, schemaUpdateProvisionings);

    let provisioning = await Provisioning.findById(provisioningId).exec();
    if (!provisioning) {
      // not found
      throw new NotFoundError(`provisioning=${provisioningId}`);
    }

    const { profile: existingProfile, status, taskResults } = provisioning;

    if (status !== ProcessStatus.COMPLETE && status !== ProcessStatus.ERROR) {
      throw new InvalidOperationError(`Cannot update provisioning when status is ${status}`);
    }

    // check if difference in profile update
    const newProfile = _.extend(existingProfile, profile);
    const processId = await run(provisioningId, newProfile, taskResults);

    // update storage if process execution success
    logger(`Run process with processId ${processId}`);
    provisioning = await Provisioning.findByIdAndUpdate(provisioningId, {
      status: ProcessStatus.UPDATING,
      processId,
      profile: newProfile,
    }).exec();

    return _.pick(provisioning, PUBLIC_PROPS);
  }

  return {
    createProvisioning,
    getProvisioning,
    getProvisionings,
    updateProvisioning,
  };
}
