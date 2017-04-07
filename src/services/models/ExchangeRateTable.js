import { Schema } from 'mongoose';
import { check } from 'm800-util';

import { RateTableType } from './../../domain';

function createSchema() {
  const rowSchema = new Schema({
    code: { type: Number, required: true },
    name: { type: String, required: true },
    rate: { type: Number, required: true },
  }, {
    _id: false,
  });
  const schema = new Schema({
    baseCurrency: { type: Number, required: true },
    rows: [rowSchema],
  });
  return schema;
}

export function createExchangeRateTableModel(RateTable) {
  check.ok('RateTable', RateTable);
  return RateTable.discriminator(RateTableType.CURRENCY_EXCHANGE, createSchema());
}

export default createExchangeRateTableModel;
