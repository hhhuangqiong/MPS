import mongoose, { Schema } from 'mongoose';
import mongooseTimestamp from 'mongoose-timestamp';
import { check } from 'm800-util';

import { RateTableTypes } from './../../domain';

// Arghh... Cannot reuse existing schemas as mongoose is recreating TTL index in embedded array.
const rateTableSchema = new Schema({
  name: { type: String, required: true },
  baseCurrency: { type: Number },
  type: { type: String, enum: RateTableTypes, required: true },
  rows: [Schema.Types.Mixed],
});

const schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  companyId: { type: String, required: true },
  isAvailable: { type: Boolean, required: true },
  baseCurrency: { type: Number, required: true },
  rateTables: [rateTableSchema],
}, {
  collection: 'BillingPlan',
});

schema.plugin(mongooseTimestamp);

export function createBillingPlanModel(mongooseConnection = mongoose) {
  check.ok('mongooseConnection', mongooseConnection);
  return mongooseConnection.model('BillingPlan', schema);
}

export default createBillingPlanModel;
