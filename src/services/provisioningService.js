import uuid from 'uuid';
import Promise from 'bluebird';
import { InvalidOperationError, NotFoundError, ValidationError } from 'common-errors';
import Joi from 'joi';
import _ from 'lodash';
import { check } from 'm800-util';

import { validator } from './util';
import {
  ProcessStatus,
  ProcessStatuses,
  ServiceTypes,
  Capabilities,
  PaymentModes,
  ChargeWallets,
  PROVISIONING_EVENT,
} from './../domain';

const REGEX_NUMBER_LOWERCASE_ONLY = /^[a-z0-9]+$/;
const REGEX_MONGO_OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const PUBLIC_PROPS = ['id', 'profile', 'status', 'taskErrors', 'taskResults', 'createdAt', 'updatedAt'];

export function provisioningService(logger, Provisioning, eventBus) {
  check.ok('logger', logger);
  check.ok('eventBus', eventBus);
  check.ok('Provisioning', Provisioning);

  const CREATE_PROVISIONING_SCHEMA = Joi.object({
    companyInfo: Joi.object({
      name: Joi.string().required(),
      timezone: Joi.string(),
    }),
    country: Joi.string().required(),
    companyCode: Joi.string().regex(REGEX_NUMBER_LOWERCASE_ONLY).required(),
    serviceType: Joi.string().valid(ServiceTypes),
    resellerCompanyId: Joi.string().required().regex(REGEX_MONGO_OBJECT_ID),
    resellerCarrierId: Joi.string().required(),
    capabilities: Joi.array()
      .items(Joi.string().valid(Object.values(Capabilities)))
      .unique()
      .required(),
    paymentMode: Joi.string().required().valid(PaymentModes),
    chargeWallet: Joi.string().required().valid(ChargeWallets),
    billing: Joi.object({
      smsPackageId: Joi.number().min(0),
      offnetPackageId: Joi.number().min(0),
      currency: Joi.number().min(0).required(),
    }).required(),
    smsc: Joi.object({
      needBilling: Joi.boolean().required(),
      defaultRealm: Joi.string(),
      servicePlanId: Joi.string(),
      sourceAddress: Joi.string().required(),
      realm: Joi.object({
        systemId: Joi.string().required(),
        password: Joi.string().required(),
        bindingDetails: Joi.array()
          .items(Joi.object({
            ip: Joi.string().ip().required(),
            port: Joi.number().integer().required(),
          })).min(1)
          .unique()
          .required(),
      }).optional(),
    }).required(),
    logo: Joi.object(),
  });

  async function createProvisioning(command) {
    const profile = validator.sanitize(command, CREATE_PROVISIONING_SCHEMA);
    const provisioning = await Provisioning.create({ profile });
    // TODO: can we use a single id here?
    const event = {
      processId: uuid.v4(),
      provisioningId: provisioning.id.toString(),
      profile,
      previousResults: null,
    };
    eventBus.emit(PROVISIONING_EVENT.PROVISIONING_START_REQUESTED, event);
    provisioning.processId = event.processId;
    provisioning.status = ProcessStatus.IN_PROGRESS;
    await provisioning.save();
    return _.pick(provisioning.toJSON(), PUBLIC_PROPS);
  }

  const schemaGetProvisioning = Joi.object({
    provisioningId: Joi.string().regex(REGEX_MONGO_OBJECT_ID),
  });

  async function getProvisioning(command) {
    const sanitizedCommand = validator.sanitize(command, schemaGetProvisioning);
    const provisioning = await Provisioning.findById(sanitizedCommand.provisioningId).exec();
    if (!provisioning) {
      return null;
    }
    return _.pick(provisioning.toJSON(), PUBLIC_PROPS);
  }

  const GET_PROVISIONINGS_SCHEMA = Joi.object({
    // TODO: strange filter, why not use GET /provisionings/{provisioningId} for the same purpose?
    _id: Joi.array().items(Joi.string().regex(REGEX_MONGO_OBJECT_ID)),

    status: Joi.array().items(Joi.string().valid(ProcessStatuses)),

    // Provisioning profile field filters
    'profile.carrierId': Joi.array().items(Joi.string()).optional(),
    'profile.serviceType': Joi.array().items(Joi.string().valid(ServiceTypes)),
    'profile.companyCode': Joi.array().items(Joi.string().regex(REGEX_NUMBER_LOWERCASE_ONLY)),
    'profile.companyId': Joi.array().items(Joi.string().regex(REGEX_MONGO_OBJECT_ID)),
    'profile.resellerCarrierId': Joi.array().items(Joi.string()),
    'profile.resellerCompanyId': Joi.array().items(Joi.string().regex(REGEX_MONGO_OBJECT_ID)),

    search: Joi.string(),
    // Paging parameters
    page: Joi.number().min(1).default(1),
    pageSize: Joi.number()
      .min(5)
      .max(500)
      .default(10),
  })
  .rename('provisioningId', '_id', { ignoreUndefined: true })
  .rename('carrierId', 'profile.carrierId', { ignoreUndefined: true })
  .rename('serviceType', 'profile.serviceType', { ignoreUndefined: true })
  .rename('companyCode', 'profile.companyCode', { ignoreUndefined: true })
  .rename('companyId', 'profile.companyId', { ignoreUndefined: true })
  .rename('resellerCarrierId', 'profile.resellerCarrierId', { ignoreUndefined: true })
  .rename('resellerCompanyId', 'profile.resellerCompanyId', { ignoreUndefined: true });

  const PROVISIONING_FILTERS = [
    '_id',
    'status',
    'profile.carrierId',
    'profile.serviceType',
    'profile.companyCode',
    'profile.companyId',
    'profile.resellerCarrierId',
    'profile.resellerCompanyId',
    // backward compatibility
    'provisioningId',
    'carrierId',
    'serviceType',
    'companyCode',
    'companyId',
    'resellerCarrierId',
    'resellerCompanyId',
  ];


  async function getProvisionings(command) {
    // As joi doesn't support csv to array transform, do it before sanitization
    command = _.mapValues(command, (value, key) => {
      const isCsvField = _.includes(PROVISIONING_FILTERS, key) && _.isString(value);
      return isCsvField ? value.split(',') : value;
    });
    const sanitizedCommand = validator.sanitize(command, GET_PROVISIONINGS_SCHEMA);
    const filters = _(sanitizedCommand)
      .pick(PROVISIONING_FILTERS)
      .mapValues(arr => ({ $in: arr }))
      .value();
    const { search, page, pageSize } = sanitizedCommand;
    if (search) {
      filters['profile.companyCode'] = { $regex: new RegExp(`.*${search}.*`) };
    }
    const offset = (page - 1) * pageSize;
    const query = () => Provisioning.find(filters);
    const { items, total } = await Promise.props({
      items: query()
        .skip(offset)
        .limit(pageSize)
        .select(PUBLIC_PROPS.join(' '))
        .sort({ createdAt: -1 })
        .exec()
        .then(i => i.map(x => x.toJSON())),
      total: query().count(),
    });
    const pageTotal = Math.ceil(total / pageSize);
    return {
      page,
      pageSize,
      pageTotal,
      total,
      items,
    };
  }

  const UPDATE_PROVISIONING_SCHEMA = Joi.object({
    provisioningId: Joi.string().regex(REGEX_MONGO_OBJECT_ID).required(),
    // only fields that are allowed to update after creation
    profile: Joi.object({
      companyInfo: Joi.object({
        name: Joi.string(),
        timezone: Joi.string(),
      }),
      country: Joi.string(),
      companyCode: Joi.string().regex(REGEX_NUMBER_LOWERCASE_ONLY),
      serviceType: Joi.string().valid(Object.values(ServiceTypes)),
      resellerCompanyId: Joi.string().regex(REGEX_MONGO_OBJECT_ID),
      resellerCarrierId: Joi.string(),
      capabilities: Joi.array()
        .items(Joi.string().valid(Object.values(Capabilities)))
        .unique(),
      paymentMode: Joi.string().valid(PaymentModes),
      chargeWallet: Joi.string().valid(Object.values(ChargeWallets)),
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
        realm: Joi.object({
          systemId: Joi.string(),
          password: Joi.string(),
          bindingDetails: Joi.array()
            .items(Joi.object({
              ip: Joi.string(),
              port: Joi.number(),
            })),
        }),
      }),
    }).required(),
  });

  async function updateProvisioning(command) {
    const { provisioningId, profile } = validator.sanitize(command, UPDATE_PROVISIONING_SCHEMA);
    let provisioning = await Provisioning.findById(provisioningId).exec();
    if (!provisioning) {
      // not found
      throw new NotFoundError('Provisioning');
    }
    const { profile: existingProfile, status } = provisioning;
    if (status !== ProcessStatus.COMPLETE && status !== ProcessStatus.ERROR) {
      throw new InvalidOperationError(`Cannot update provisioning when status is ${status}`);
    }
    // check if difference in profile update
    const newProfile = _.extend({}, existingProfile, profile);

    // validation logic from old validateRerun
    // TODO: check if this FIELD_IN_SERVICE is used anywhere, if not rename to more meaningful
    if (existingProfile.companyCode !== newProfile.companyCode) {
      throw new ValidationError('Company code cannot be updated', 'FIELD_IN_SERVICE', 'profile.companyCode');
    }
    if (existingProfile.serviceType !== newProfile.serviceType) {
      throw new ValidationError('Service type cannot be updated', 'FIELD_IN_SERVICE', 'profile.serviceType');
    }
    const processId = uuid.v4();

    const query = {
      $and: [
        { _id: provisioningId },
        {
          $or: [
            { status: ProcessStatus.COMPLETE },
            { status: ProcessStatus.ERROR },
          ],
        },
      ],
    };
    const update = {
      $set: {
        status: ProcessStatus.UPDATING,
        profile: newProfile,
        processId,
      },
    };
    provisioning = await Provisioning.findOneAndUpdate(query, update, { new: true });
    if (!provisioning) {
      throw new InvalidOperationError(`Provisioning ${provisioningId} has been already started.`);
    }
    const event = {
      provisioningId,
      processId: uuid.v4(),
      profile: newProfile,
      previousResults: provisioning.taskResults || {},
    };
    logger.info(`Going to run process with processId ${processId}...`);
    eventBus.emit(PROVISIONING_EVENT.PROVISIONING_START_REQUESTED, event);
    // TODO: return updated entity here?
    return { id: provisioningId };
  }

  const COMPLETE_PROVISIONING_SCHEMA = Joi.object({
    errors: Joi.array().default([]),
    results: Joi.object(),
    provisioningId: Joi.string().required(),
  });

  async function completeProvisioning(command) {
    // check is used here instead of validator as it is system method, so it always expects valid data
    const sanitizedCommand = check.sanitizeSchema('command', command, COMPLETE_PROVISIONING_SCHEMA);
    const {
      errors,
      results,
      provisioningId,
    } = sanitizedCommand;

    // mark provisioning status as error if any error happened during process
    const status = errors.length > 0 ? ProcessStatus.ERROR : ProcessStatus.COMPLETE;
    const FIELDS_TO_UPDATE_IN_PROFILE = ['companyId', 'carrierId'];
    const profileUpdates = _(results)
      .pick(FIELDS_TO_UPDATE_IN_PROFILE)
      .mapKeys((value, key) => `profile.${key}`)
      .value();
    const dbUpdate = _.extend({
      taskResults: results,
      taskErrors: errors,
      status,
    }, profileUpdates);
    await Provisioning.findByIdAndUpdate(provisioningId, dbUpdate);
    logger.info(`Process complete for Provisioning: ${provisioningId}, profile changes `, profileUpdates);
  }

  return {
    createProvisioning,
    getProvisioning,
    getProvisionings,
    updateProvisioning,
    completeProvisioning,
  };
}

export default provisioningService;
