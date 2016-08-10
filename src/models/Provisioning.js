import mongoose, { Schema } from 'mongoose';

import createModel from '../utils/createModel';

const CREATED = 'CREATED';
const COMPLETE = 'COMPLETE';
const IN_PROGRESS = 'IN_PROGRESS';
const ERROR = 'ERROR';
const UPDATING = 'UPDATING';

export const statusTypes = {
  CREATED,
  COMPLETE,
  IN_PROGRESS,
  ERROR,
  UPDATING,
};


const ProvisioningProfileModel = {
  companyInfo: {
    name: { type: String, required: true },
    description: { type: String },
    timezone: { type: String },
    contact: { type: String },

  },
  companyCode: { type: String, required: true },
  capabilities: { type: Array, required: true },
  country: { type: String, required: true },
  resellerCarrierId: { type: String, required: true },
  serviceType: { type: String, required: true },
  paymentMode: { type: String, required: true },

  // fields to be generated in process, not required
  companyId: { type: String },
};

const schema = createModel({

  profile: ProvisioningProfileModel,

  // Caches the updated status from the last provisioning process
  status: { type: String, required: true, enum: Object.values(statusTypes), default: CREATED },

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
});

export default mongoose.model('Provisioning', schema);
