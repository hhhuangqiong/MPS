import _ from 'lodash';
import mongoose, { Schema } from 'mongoose';
import unqiueValidator from 'mongoose-unique-validator';
import timestamps from 'mongoose-timestamp';

import { check } from './../../util';
import {
  ServiceTypes,
  Capabilities,
  PaymentModes,
  ChargeWallets,
  ProcessStatuses,
  ProcessStatus,
} from './../../domain';

const profileSchema = {
  companyInfo: {
    name: { type: String, required: true },
    description: { type: String },
    timezone: { type: String },
    contact: { type: String },
  },
  companyCode: { type: String, required: true, unique: true },
  capabilities: { type: Array, enum: Capabilities },
  country: { type: String, required: true },
  resellerCompanyId: { type: String, required: true },
  resellerCarrierId: { type: String, required: true },
  serviceType: { type: String, required: true, enum: ServiceTypes },
  paymentMode: { type: String, required: true, enum: PaymentModes },
  chargeWallet: { type: String, required: true, enum: ChargeWallets },
  billing: {
    smsPackageId: { type: Number },
    offnetPackageId: { type: Number },
    currency: { type: Number, required: true },
  },
  smsc: {
    // whether to need to charge sms through OCS. i.e. Boss Provision
    needBilling: { type: Boolean, required: true },
    defaultRealm: { type: String },
    servicePlanId: { type: String },
    sourceAddress: { type: String, required: true },
    realm: {
      type: Schema.Types.Mixed,
      systemId: { type: String },
      password: { type: String },
      bindingDetails: [{
        ip: { type: String },
        port: { type: Number },
        // exclude _id in the array
        _id: false,
      }],
      default: undefined,
    },
  },
  // fields to be generated in process, not required
  companyId: { type: String },
  carrierId: { type: String },
};


const schema = new Schema({
  profile: profileSchema,
  // Caches the updated status from the last provisioning process
  status: { type: String, required: true, enum: ProcessStatuses, default: ProcessStatus.CREATED },
  // Caches the process id from the last provisioning process
  processId: { type: String },
  // provsioning process result, cannot be defined as this is up to the procees>task's result
  taskResults: Schema.Types.Mixed,
  // errors, cannot be defined as this is up to the procees>task's result
  taskErrors: Schema.Types.Mixed,
  // A timestamp will be added when the bpmn has successfully completed its lifecycle
  finishAt: Date,
}, { versionKey: false });

schema.set('toJSON', {
  getters: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

// Temporary fixes to migrate all provisioning documents to the new schema
schema.path('taskErrors').get(storedValue => {
  if (!storedValue) {
    return [];
  }
  if (_.isArray(storedValue)) {
    return storedValue;
  }
  return _(storedValue)
    .map((value, key) => ({
      ...value,
      eventName: key,
      traceId: key,
    }))
    .value();
});
schema.path('taskResults').get(storedValue => {
  if (!storedValue) {
    return {};
  }
  if (!storedValue.COMPANY_CREATION) {
    return storedValue;
  }
  return _.extend({}, ..._.values(storedValue));
});

schema.plugin(timestamps);
schema.plugin(unqiueValidator);

if (process.env.NODE_ENV === 'production') {
  schema.set('autoIndex', false);
}

export function createProvisioningModel(mongooseConnection = mongoose) {
  check.ok('mongooseConnection', mongooseConnection);
  return mongooseConnection.model('Provisioning', schema);
}

export default createProvisioningModel;
