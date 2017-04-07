import _ from 'lodash';
import Joi from 'joi';
import { countries } from 'country-data';
import { ValidationError } from 'common-errors';

import { normalizeFieldNames } from './parsingUtilities';
import { PhoneNumberTypes, trimPhoneNumber } from './../phoneNumber';
import { mapJoiErrorDetailToValidationError } from './../../util';

export const OFF_NET_CALL_RATE_TABLE_COLUMNS = [
  'name',
  'countryCode',
  'phoneCode',
  'phoneNumberType',
  'rate',
  'connectionFee',
  'homeArea',
  'originArea',
];

const ROW_SCHEMA = Joi.object({
  name: Joi.string().min(1).trim(),
  countryCode: Joi.string()
    .min(1)
    .trim()
    .uppercase(),
  homeArea: Joi.string().optional(),
  originArea: Joi.string().optional(),
  phoneNumberType: Joi.string().only(PhoneNumberTypes),
  phoneCode: Joi.string()
    .min(1)
    .replace(/\s/g, ''),
  rate: Joi.number().min(0),
  connectionFee: Joi.number().min(0).optional(),
}).options({
  presence: 'required',
});

const ROWS_SCHEMA = Joi.array()
  .items(ROW_SCHEMA)
  .unique('phoneCode')
  .min(1)
  .required();

const normalizeRow = _.partial(normalizeFieldNames, _, OFF_NET_CALL_RATE_TABLE_COLUMNS);

export const CallRateValidationErrorType = {
  UnknownCountryCode: 'rateTable.unknownCountryCode',
  PhoneCodeMismatch: 'rateTable.phoneCodeMismatch',
};

export default function sanitizeCallRateTable(table) {
  const rows = table.rows.map(normalizeRow);
  const { value: sanitizedTable, error: joiError } = Joi.validate(
    { ...table, rows },
    Joi.object({ rows: ROWS_SCHEMA }),
    { abortEarly: false, allowUnknown: true },
  );
  const domainErrors = _.flatMap(sanitizedTable.rows, (row, index) => {
    const errors = [];
    const country = countries[row.countryCode];
    // 1. Country code should be known
    if (!country) {
      errors.push(new ValidationError(
        `Unknown country code: ${row.countryCode}.`,
        CallRateValidationErrorType.UnknownCountryCode,
        `rows.${index}.code`,
      ));
    // 2. Phone code should start from country code
    } else {
      const countryPhoneCodes = country.countryCallingCodes.map(trimPhoneNumber);
      const phoneCodeLooksGood = _.some(
        countryPhoneCodes,
        countryPhoneCode => _.startsWith(row.phoneCode, countryPhoneCode),
      );
      if (!phoneCodeLooksGood) {
        errors.push(new ValidationError(
          `Expected phone code to start with ${countryPhoneCodes.join(' or ')}.`,
          CallRateValidationErrorType.PhoneCodeMismatch,
          `rows.${index}.code`,
        ));
      }
    }
    return errors;
  });
  const allErrors = (joiError ? joiError.details : [])
    .map(mapJoiErrorDetailToValidationError)
    .concat(domainErrors);
  let error = null;
  if (allErrors.length > 0) {
    error = new ValidationError(`Invalid call rate table (${allErrors.length} problems).`);
    error.addErrors(allErrors);
  }
  return {
    result: sanitizedTable,
    error,
  };
}
