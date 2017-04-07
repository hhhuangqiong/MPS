import { Schema } from 'mongoose';
import { check } from 'm800-util';

import { RateTableType } from './../../domain';

function createSchema() {
  const rowSchema = new Schema({
    name: { type: String, required: true },
    phoneCode: { type: String, required: true },
    rate: { type: Number, required: true },
  }, {
    _id: false,
  });
  const schema = new Schema({
    rows: [rowSchema],
  });
  return schema;
}

export function createSmsRateTableModel(RateTable) {
  check.ok('RateTable', RateTable);
  return RateTable.discriminator(RateTableType.SMS, createSchema());
}

export default createSmsRateTableModel;
