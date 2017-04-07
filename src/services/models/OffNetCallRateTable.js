import { Schema } from 'mongoose';
import _ from 'lodash';
import { check } from 'm800-util';

import { PhoneNumberType, RateTableType } from './../../domain';

function createSchema() {
  const rowSchema = new Schema({
    name: { type: String, required: true },
    countryCode: { type: String, required: true },
    homeArea: { type: String },
    originArea: { type: String },
    phoneNumberType: { type: String, enum: _.values(PhoneNumberType), required: true },
    phoneCode: { type: String, required: true },
    rate: { type: Number, required: true },
    connectionFee: { type: Number },
  }, {
    _id: false,
  });
  const schema = new Schema({
    rows: [rowSchema],
  });
  return schema;
}

export function createOffNetCallRateTableModel(RateTable) {
  check.ok('RateTable', RateTable);
  return RateTable.discriminator(RateTableType.OFFNET_CALL, createSchema());
}

export default createOffNetCallRateTableModel;
