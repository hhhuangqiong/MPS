import mongoose, { Schema } from 'mongoose';
import unqiueValidator from 'mongoose-unique-validator';
import timestamps from 'mongoose-timestamp';

import { ServiceTypes, PaymentModes, ChargeWallets } from './Provisioning';


const schema = new Schema({
  presetId: { type: String, unique: true, required: true, index: true },
  serviceType: { type: String, enum: Object.values(ServiceTypes) },
  paymentMode: { type: String, enum: Object.values(PaymentModes) },
  chargeWallet: { type: String, enum: Object.values(ChargeWallets) },
  capabilities: { type: Array },
  billing: {
    smsPackageId: { type: Number },
    offnetPackageId: { type: Number },
    currency: { type: Number },
  },
  smsc: {
    needBilling: { type: Boolean },
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
