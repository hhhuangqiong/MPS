import Joi from 'joi';
import { check } from 'm800-util';

import { RateTableType, RateTableTypes } from './rateTableType';
import sanitizeCurrencyExchangeRateTable from './sanitizeCurrencyExchangeRateTable';
import sanitizeSmsRateTable from './sanitizeSmsRateTable';
import sanitizeCallRateTable from './sanitizeCallRateTable';

const SANITIZERS = {
  [RateTableType.CURRENCY_EXCHANGE]: sanitizeCurrencyExchangeRateTable,
  [RateTableType.SMS]: sanitizeSmsRateTable,
  [RateTableType.OFFNET_CALL]: sanitizeCallRateTable,
};

export default function sanitizeRateTable(table) {
  check.schema('table', table, Joi.object({
    name: Joi.string(),
    type: Joi.string().only(RateTableTypes),
    baseCurrency: Joi.number().when('type', {
      is: RateTableType.CURRENCY_EXCHANGE,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    rows: Joi.array().min(1),
  }));

  const sanitize = SANITIZERS[table.type];
  return sanitize(table);
}
