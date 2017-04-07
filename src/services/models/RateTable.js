import mongoose, { Schema } from 'mongoose';
import mongooseTimestamp from 'mongoose-timestamp';
import { check } from 'm800-util';

const DAY_IN_SECONDS = 24 * 60 * 60;

const schema = new Schema({
  name: { type: String },
}, {
  collection: 'RateTable',
  discriminatorKey: 'type',
});

schema.index({ createdAt: -1 }, { expireAfterSeconds: DAY_IN_SECONDS });
schema.plugin(mongooseTimestamp);

export function createRateTableModel(mongooseConnection = mongoose) {
  check.ok('mongooseConnection', mongooseConnection);
  return mongooseConnection.model('RateTable', schema);
}

export default createRateTableModel;
