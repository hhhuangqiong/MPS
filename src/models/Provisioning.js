import mongoose, { Schema } from 'mongoose';
import unqiueValidator from 'mongoose-unique-validator';
import timestamps from 'mongoose-timestamp';

export const ProcessStatus = {
  CREATED: 'CREATED',
  COMPLETE: 'COMPLETE',
  IN_PROGRESS: 'IN_PROGRESS',
  ERROR: 'ERROR',
  UPDATING: 'UPDATING',
};

export const ServiceTypes = {
  SDK: 'SDK',
  WHITE_LABEL: 'WHITE_LABEL',
  LIVE_CONNECT: 'LIVE_CONNECT',
};

export const Capabilities = {
  IM: 'im',
  IM_TO_SMS: 'im.im-to-sms',
  CALL_ONNET: 'call.onnet',
  CALL_OFFNET: 'call.offnet',
  CALL_MAAII_IN: 'call.maaii-in',
  PUSH: 'push',
  VERIFICATION_MO: 'verification.mo',
  VERIFICATION_MT: 'verification.mt',
  VERIFICATION_SMS: 'verification.sms',
  VERIFICATION_IVR: 'verification.ivr',
  VSF: 'vsf',
  PLATFORM_ANDROID: 'platform.android',
  PLATFORM_IOS: 'platform.ios',
  PLATFORM_WEB: 'platform.web',
  END_USER_WHITELIST: 'end-user.whitelist',
  END_USER_SUSPENSION: 'end-user.suspension',
};

export const ChargeWallets = {
  WALLET_NONE: 'WALLET_NONE',
  WALLET_END_USER: 'WALLET_END_USER',
  WALLET_COMPANY: 'WALLET_COMPANY',
  WALLET_OCS_INTEGRATION: 'WALLET_OCS_INTEGRATION',
};

export const PaymentModes = ['PRE_PAID', 'POST_PAID'];

const ProvisioningProfileModel = {
  companyInfo: {
    name: { type: String, required: true },
    description: { type: String },
    timezone: { type: String },
    contact: { type: String },
  },
  companyCode: { type: String, required: true, unique: true },
  capabilities: { type: Array, enum: Object.values(Capabilities) },
  country: { type: String, required: true },
  resellerCompanyId: { type: String, required: true },
  resellerCarrierId: { type: String, required: true },
  serviceType: { type: String, required: true, enum: Object.values(ServiceTypes) },
  paymentMode: { type: String, required: true, enum: PaymentModes },
  billing: {
    smsPackageId: { type: Number },
    offnetPackageId: { type: Number },
    currency: { type: Number, required: true },
  },
  smsc: {
    // whether to need to charge sms through OCS. i.e. Boss Provision
    needBilling: { type: Boolean, required: true },
    defaultRealm: { type: String, required: true },
    servicePlanId: { type: String, required: true },
    sourceAddress: { type: String, required: true },
  },
  // fields to be generated in process, not required
  companyId: { type: String },
  carrierId: { type: String },
};

const schema = new Schema({

  profile: ProvisioningProfileModel,

  // Caches the updated status from the last provisioning process
  status: { type: String, required: true, enum: Object.values(ProcessStatus), default: ProcessStatus.CREATED },

  // Caches the process id from the last provisioning process
  processId: { type: String },

  // provsioning process result
  // cannot be defined as this is up to the procees>task's result
  taskResults: Schema.Types.Mixed,

  // errors
  // cannot be defined as this is up to the procees>task's result
  taskErrors: Schema.Types.Mixed,

  // A timestamp will be added when the bpmn has successfully completed its lifecycle
  finishAt: Date,
}, { versionKey: false });

if (!schema.options.toJSON) schema.options.toJSON = {};
schema.options.toJSON.transform = (doc, ret) => {
  // remove the _id of every document before returning the result
  /* eslint-disable no-underscore-dangle */
  ret.id = ret._id;
  delete ret._id;
  /* eslint-disable no-underscore-dangle */
};

schema.plugin(timestamps);
schema.plugin(unqiueValidator);

if (process.env.NODE_ENV === 'production') {
  schema.set('autoIndex', false);
}

export default mongoose.model('Provisioning', schema);
