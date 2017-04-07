import _ from 'lodash';
import Joi from 'joi';
import { callingCountries } from 'country-data';
import { ValidationError } from 'common-errors';

import { normalizeFieldNames } from './parsingUtilities';
import { trimPhoneNumber } from './../phoneNumber';
import { mapJoiErrorDetailToValidationError } from './../../util';

export const SMS_RATE_TABLE_COLUMNS = [
  'name',
  'phoneCode',
  'rate',
];

const ROW_SCHEMA = Joi.object({
  name: Joi.string().min(1).trim(),
  phoneCode: Joi.string()
    .min(1)
    .trim()
    .replace(/\s/g, ''),
  rate: Joi.number().min(0),
}).options({
  presence: 'required',
});

const ROWS_SCHEMA = Joi.array()
  .items(ROW_SCHEMA)
  .unique('name')
  .unique('phoneCode')
  .min(1)
  .required();

export const SmsRateValidationErrorType = {
  UnknownPhoneCode: 'rateTable.unknownPhoneCode',
};

const getPhoneCodeSet = _.memoize(() => {
  const codes = _(callingCountries.all)
    .flatMap(c => c.countryCallingCodes)
    .map(trimPhoneNumber)
    .uniq()
    .value();
  return new Set(codes);
});

function isKnownPhoneCode(phoneCode) {
  const codes = getPhoneCodeSet();
  return codes.has(phoneCode);
}

const normalizeRow = _.partial(normalizeFieldNames, _, SMS_RATE_TABLE_COLUMNS);

export default function sanitizeSmsRateTable(table) {
  const rows = table.rows.map(normalizeRow);
  const { value: sanitizedTable, error: joiError } = Joi.validate(
    { ...table, rows },
    Joi.object({ rows: ROWS_SCHEMA }),
    { abortEarly: false, allowUnknown: true },
  );
  const domainErrors = _.flatMap(sanitizedTable.rows, (row, index) => {
    const errors = [];
    // Phone code should be known
    if (!isKnownPhoneCode(row.phoneCode)) {
      errors.push(new ValidationError(
        `Unknown phone code: ${row.phoneCode}.`,
        SmsRateValidationErrorType.UnknownPhoneCode,
        `rows[${index}].code`,
      ));
    }
    return errors;
  });
  const allErrors = (joiError ? joiError.details : [])
    .map(mapJoiErrorDetailToValidationError)
    .concat(domainErrors);
  let error = null;
  if (allErrors.length > 0) {
    error = new ValidationError(`Invalid SMS rate table (${allErrors.length} problems).`);
    error.addErrors(allErrors);
  }
  return {
    result: sanitizedTable,
    error,
  };
}
