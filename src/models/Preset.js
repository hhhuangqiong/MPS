import mongoose, { Schema } from 'mongoose';
import unqiueValidator from 'mongoose-unique-validator';
import timestamps from 'mongoose-timestamp';

import { ServiceTypes, PaymentModes } from './Provisioning';


const schema = new Schema({
  presetId: { type: String, unique: true, required: true, index: true },
  serviceType: { type: String, enum: Object.values(ServiceTypes) },
  paymentMode: { type: String, enum: Object.values(PaymentModes) },
  capabilities: { type: Array },
  smsc: {
    defaultRealm: { type: String },
    servicePlanId: { type: String },
    sourceAddress: { type: String },
  },
}, { id: false, versionKey: false });

if (!schema.options.toJSON) schema.options.toJSON = {};
schema.options.toJSON.transform = (doc, ret) => {
  // remove the _id of every document before returning the result
  /* eslint-disable no-underscore-dangle */
  delete ret._id;
  /* eslint-disable no-underscore-dangle */
};

schema.plugin(timestamps);
schema.plugin(unqiueValidator);


export default mongoose.model('Preset', schema);
