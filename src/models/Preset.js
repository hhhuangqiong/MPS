import mongoose from 'mongoose';
import unqiueValidator from 'mongoose-unique-validator';

import createModel from '../utils/createModel';
import { ServiceTypes, PaymentModes } from './Provisioning';


const schema = createModel({
  presetId: { type: String, unique: true, required: true, index: true },
  serviceType: { type: String, enum: Object.values(ServiceTypes) },
  paymentMode: { type: String, enum: Object.values(PaymentModes) },
  capabilities: { type: Array },
}, { id: false, versionKey: false });

if (!schema.options.toJSON) schema.options.toJSON = {};
schema.options.toJSON.transform = (doc, ret) => {
  // remove the _id of every document before returning the result
  /* eslint-disable no-underscore-dangle */
  delete ret._id;
  /* eslint-disable no-underscore-dangle */
};

schema.plugin(unqiueValidator);

export default mongoose.model('Preset', schema);
