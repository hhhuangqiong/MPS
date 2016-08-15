import AlreadyInUseError from 'common-errors';
import injectProvisioningProcess from '../processes/provisioning/inject';
import Provisioning, { statusTypes } from '../models/Provisioning';
import Joi from 'joi';

// @todo to be verified on requirement
const REGEX_NUMBER_LETTERS_ONLY = /[a-zA-Z0-9]+/;
const REGEX_MONGO_OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const CAPABILITIES = [
  'im',
  'im.im-to-sms',
  'call',
  'call.onnet',
  'call.offnet',
  'call.maaii-in',
  'wallet',
  'verification',
];

const SERVICE_TYPES = ['SDK', 'WHITE_LABEL', 'LIVE_CONNECT'];
const PAYMENT_MODES = ['PRE_PAID', 'POST_PAID'];

export default function provisioningService(processManager, validator) {
  /**
   * Triggered upon provisioning process complete, save results
   */
  function onProcessComplete(provisionId, { taskResults, errors }) {
    if (errors) {
      Provisioning.findByIdAndUpdate(
        provisionId,
        { errors, taskResults, status: statusTypes.ERROR }
      );

      return;
    }

    Provisioning.findByIdAndUpdate(provisionId, { taskResults, status: statusTypes.COMPLETE });
  }

  const { startProcess } = injectProvisioningProcess(processManager, onProcessComplete);


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
    serviceType: Joi.string().valid(SERVICE_TYPES),
    resellerCarrierId: Joi.string().required(),
    capabilities: Joi
      .array()
      .items(
        Joi.string().valid(CAPABILITIES)
      )
      .unqiue()
      .required(),
    paymentMode: Joi.string().required().valid(PAYMENT_MODES),
  });

  async function createProvision(command) {
    const profile = validator.sanitize(command, schemaCreateProvision);

    const provisioning = await Provisioning.create({
      profile,
    });

    /* eslint-disable no-underscore-dangle */
    const processId = await startProcess(provisioning._id, profile);
    /* eslint-enable */

    provisioning.processId = processId;
    provisioning.status = statusTypes.IN_PROGRESS;
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
    serviceType: Joi.array().items(Joi.string().valid(SERVICE_TYPES)).optional(),
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
    } = validator.sanitize(command, schemaGetProvisionings);

    const filters = {};
    if (companyCode) filters['profile.companyCode'] = { $in: companyCode };
    if (serviceType) filters['profile.serviceType'] = { $in: serviceType };
    if (companyId) filters['profile.companyId'] = { $in: companyId };

    const query = Provisioning.find(filters)
      .skip(page)
      .limit(pageSize)
      .select({ taskResults: 1, status: 1, profile: 1 })
      .sort({ createdAt: -1 });

    // count() ignores skip() and limits() by default

    const result = await Promise.props({
      items: query.exec(),
      count: query.count(),
    });
    const pageTotal = Math.ceil(result.items / pageSize);

    return {
      page,
      pageSize,
      pageTotal,
      total: result.items,
      provisionings: result.items,
    };
  }

  const schemaUpdateProvisionings = Joi.object({
    provisioningId: Joi.string().regex(REGEX_MONGO_OBJECT_ID),
    // only fields that are allowed to update after creation
    profile: Joi.object({
      country: Joi.string().optional(),
      companyCode: Joi.string().regex(REGEX_NUMBER_LETTERS_ONLY).optional(),
      serviceType: Joi.string().valid(SERVICE_TYPES).optional(),
      capabilities: Joi
        .array()
        .items(Joi.string().valid(CAPABILITIES))
        .unqiue()
        .optional(),
      paymentMode: Joi
        .string()
        .required()
        .valid(PAYMENT_MODES)
        .optional(),
    }),
  });

  async function updateProvisioning(command) {
    const { provisioingId, profile } = validator.sanitize(command, schemaUpdateProvisionings);

    const provisioning = await Provisioning.findById(provisioingId);
    const { id: provisioningId, status, taskResults } = provisioning;

    if (status !== statusTypes.COMPLETE ||
      status !== statusTypes.ERROR) {
      throw new AlreadyInUseError(
        `Cannot update provisioning when status is ${status}`,
        'RetryOnErrorOrCompleteOnly'
      );
    }

    const processId = await startProcess(provisioingId, profile, taskResults);

    return await Provisioning.findByIdAndUpdate(provisioningId, {
      status: statusTypes.UPDATING,
      process: processId,
      profile,
    }).exec();
  }

  return {
    createProvision,
    getProvisioning,
    getProvisionings,
    updateProvisioning,
  };
}
