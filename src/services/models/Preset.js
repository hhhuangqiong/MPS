import mongoose, { Schema } from 'mongoose';
import unqiueValidator from 'mongoose-unique-validator';
import timestamps from 'mongoose-timestamp';
import { check } from 'm800-util';

import { ServiceTypes, PaymentModes, ChargeWallets } from './../../domain';

const schema = new Schema({
  presetId: { type: String, unique: true, required: true, index: true },
  serviceType: { type: String, enum: ServiceTypes },
  paymentMode: { type: String, enum: PaymentModes },
  chargeWallet: { type: String, enum: ChargeWallets },
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

export function createPresetModel(mongooseConnection = mongoose) {
  check.ok('mongooseConnection', mongooseConnection);
  return mongooseConnection.model('Preset', schema);
}

export default createPresetModel;
