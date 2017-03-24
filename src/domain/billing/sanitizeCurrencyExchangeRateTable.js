import Joi from 'joi';
import currency from 'currency-codes';
import { ValidationError } from 'common-errors';
import _ from 'lodash';

import { normalizeFieldNames } from './parsingUtilities';
import { mapJoiErrorDetailToValidationError } from './../../util';

export const EXCHANGE_RATE_TABLE_COLUMNS = [
  'name',
  'code',
  'rate',
];

const ROW_SCHEMA = Joi.object({
  code: Joi.number(),
  name: Joi.string().trim().uppercase(),
  rate: Joi.number().positive(),
}).options({
  presence: 'required',
});

const ROWS_SCHEMA = Joi.array()
  .items(ROW_SCHEMA)
  .unique('name')
  .unique('code')
  .required();

export const ExchangeRateValidationErrorType = {
  RedundantBaseCurrency: 'rateTable.redundantBaseCurrency',
  UnknownBaseCurrency: 'rateTable.unknownCurrencyCode',
  CurrencyCodeMismatch: 'rateTable.currencyCodeMismatch',
};

const normalizeRow = _.partial(normalizeFieldNames, _, EXCHANGE_RATE_TABLE_COLUMNS);

export default function sanitizeCurrencyExchangeTable(table) {
  const rows = table.rows.map(normalizeRow);
  const { value: sanitizedTable, error: joiError } = Joi.validate(
    { ...table, rows },
    Joi.object({ rows: ROWS_SCHEMA }),
    { abortEarly: false, allowUnknown: true },
  );
  const domainErrors = _.flatMap(sanitizedTable.rows, (row, index) => {
    const errors = [];
    // 1. Base currency should not be present in rate table
    if (_.parseInt(table.baseCurrency) === row.code) {
      errors.push(new ValidationError(
        `Redundant base currency row. Base currency code is ${table.baseCurrency}.`,
        ExchangeRateValidationErrorType.RedundantBaseCurrency,
        `rows.${index}.code`,
      ));
    }
    // 2. Currency should be known
    const expectedCurrency = currency.number(row.code);
    if (!expectedCurrency) {
      errors.push(new ValidationError(
        `Unknown currency code: ${row.code}.`,
        ExchangeRateValidationErrorType.UnknownBaseCurrency,
        `rows.${index}.code`,
      ));
    }
    // 3. Name and code should match the same currency
    if (expectedCurrency && expectedCurrency.code !== row.name) {
      errors.push(new ValidationError(
        `Currency code and name mismatch. Expected name: ${expectedCurrency.code}. Actual name: ${row.name}.`,
        ExchangeRateValidationErrorType.CurrencyCodeMismatch,
        `rows.${index}.code`,
      ));
    }
    return errors;
  });
  const allErrors = (joiError ? joiError.details : [])
    .map(mapJoiErrorDetailToValidationError)
    .concat(domainErrors);
  let error = null;
  if (allErrors.length > 0) {
    error = new ValidationError(`Invalid currency exchange rate table (${allErrors.length} problems).`);
    error.addErrors(allErrors);
  }
  return {
    result: sanitizedTable,
    error,
  };
}
