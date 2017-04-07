import { expect } from 'chai';
import _ from 'lodash';
import currency from 'currency-codes';
import { ValidationError } from 'common-errors';

import {
  sanitizeRateTable,
  RateTableType,
  PhoneNumberType,
  CallRateValidationErrorType as CALL_RATE_ERROR,
  SmsRateValidationErrorType as SMS_RATE_ERROR,
  ExchangeRateValidationErrorType as EXCHANGE_RATE_ERROR,
} from './../../../src/domain';

describe('domain/billing/sanitizeRateTable', () => {
  describe('exchange rate table', () => {
    it('sanitizes rows', () => {
      const inputTable = {
        name: 'exchange-rates.csv',
        type: RateTableType.CURRENCY_EXCHANGE,
        baseCurrency: _.parseInt(currency.code('USD').number),
        rows: [
          { name: ' EUR', Code: currency.code('EUR').number, RATE: 2.5 },
          { name: 'hkd  ', Code: currency.code('HKD').number, RATE: 3.6 },
        ],
      };

      const { result: actual, error } = sanitizeRateTable(inputTable);

      const expected = {
        ...inputTable,
        rows: [
          { name: 'EUR', code: _.parseInt(currency.code('EUR').number), rate: 2.5 },
          { name: 'HKD', code: _.parseInt(currency.code('HKD').number), rate: 3.6 },
        ],
      };
      expect(error).to.not.exist;
      expect(actual).to.eql(expected);
    });

    it('returns "redundant base currency" error when base currency row is included', () => {
      const inputTable = {
        name: 'exchange-rates.csv',
        type: RateTableType.CURRENCY_EXCHANGE,
        baseCurrency: _.parseInt(currency.code('USD').number),
        rows: [
          { name: 'USD', code: currency.code('USD').number, rate: 2.5 },
        ],
      };

      const { error } = sanitizeRateTable(inputTable);

      expect(error).to.be.instanceOf(ValidationError);
      const expectedError = _.find(error.errors, { code: EXCHANGE_RATE_ERROR.RedundantBaseCurrency });
      expect(expectedError).to.exist;
    });

    it('returns "currency code mismatch" error when currency name does not match code', () => {
      const inputTable = {
        name: 'exchange-rates.csv',
        type: RateTableType.CURRENCY_EXCHANGE,
        baseCurrency: _.parseInt(currency.code('EUR').number),
        rows: [
          { name: 'USD', code: currency.code('HKD').number, rate: 2.5 },
        ],
      };

      const { error } = sanitizeRateTable(inputTable);

      expect(error).to.be.instanceOf(ValidationError);
      const expectedError = _.find(error.errors, { code: EXCHANGE_RATE_ERROR.CurrencyCodeMismatch });
      expect(expectedError).to.exist;
    });

    it('returns "unknown currency code" error when currency code is invalid', () => {
      const inputTable = {
        name: 'exchange-rates.csv',
        type: RateTableType.CURRENCY_EXCHANGE,
        baseCurrency: _.parseInt(currency.code('EUR').number),
        rows: [
          { name: 'LOL', code: 1000, rate: 2.5 },
        ],
      };

      const { error } = sanitizeRateTable(inputTable);

      expect(error).to.be.instanceOf(ValidationError);
      const expectedError = _.find(error.errors, { code: EXCHANGE_RATE_ERROR.UnknownBaseCurrency });
      expect(expectedError).to.exist;
    });

    it('returns validation error when rows do not match the schema', () => {
      const inputTable = {
        name: 'exchange-rates.csv',
        type: RateTableType.CURRENCY_EXCHANGE,
        baseCurrency: _.parseInt(currency.code('EUR').number),
        rows: [
          { name: 'USD', code: '840', rate: 'a' },
        ],
      };

      const { error } = sanitizeRateTable(inputTable);

      expect(error).to.be.instanceOf(ValidationError);
    });
  });

  describe('sms rate table', () => {
    it('sanitizes rows', () => {
      const inputTable = {
        name: 'sms-rates.csv',
        type: RateTableType.SMS,
        rows: [
          { Name: ' Albania', phone_code: '355', 'Rate ': 2.5 },
          { Name: 'Hong Kong  ', phone_code: '852', 'Rate ': 3.6 },
        ],
      };

      const { result: actual, error } = sanitizeRateTable(inputTable);

      const expected = {
        ...inputTable,
        rows: [
          { name: 'Albania', phoneCode: '355', rate: 2.5 },
          { name: 'Hong Kong', phoneCode: '852', rate: 3.6 },
        ],
      };
      expect(error).to.not.exist;
      expect(actual).to.eql(expected);
    });

    it('returns "unknown phone code" error when phone code is invalid', () => {
      const inputTable = {
        name: 'sms-rates.csv',
        type: RateTableType.SMS,
        rows: [
          { name: 'Albania', phoneCode: '9999', rate: 500 },
        ],
      };

      const { error } = sanitizeRateTable(inputTable);

      expect(error).to.be.instanceOf(ValidationError);
      const expectedError = _.find(error.errors, { code: SMS_RATE_ERROR.UnknownPhoneCode });
      expect(expectedError).to.exist;
    });

    it('returns validation error when rows do not match the schema', () => {
      const inputTable = {
        name: 'sms-rates.csv',
        type: RateTableType.SMS,
        rows: [
          { name: 25, phoneCode: '375', rate: 500 },
        ],
      };

      const { error } = sanitizeRateTable(inputTable);

      expect(error).to.be.instanceOf(ValidationError);
    });
  });

  describe('call rate table', () => {
    it('sanitizes rows', () => {
      const inputTable = {
        name: 'call-rates.csv',
        type: RateTableType.OFFNET_CALL,
        rows: [
          {
            name: 'AFGHANISTAN - Fixed',
            countryCode: 'AF',
            phoneNumberType: PhoneNumberType.LANDLINE,
            phoneCode: '93',
            rate: '5.8859',

          },
          {
            name: 'AFGHANISTAN - Mobile',
            countryCode: 'AF',
            phoneNumberType: PhoneNumberType.MOBILE,
            phoneCode: '937',
            rate: '5.9',
          },
          {
            name: 'AFGHANISTAN - Mobile - AT',
            countryCode: 'AF',
            phoneNumberType: PhoneNumberType.MOBILE,
            phoneCode: '9375',
            rate: '5.9',
          },
        ],
      };
      const expected = {
        ...inputTable,
        rows: [
          {
            name: 'AFGHANISTAN - Fixed',
            countryCode: 'AF',
            phoneNumberType: PhoneNumberType.LANDLINE,
            phoneCode: '93',
            rate: 5.8859,
          },
          {
            name: 'AFGHANISTAN - Mobile',
            countryCode: 'AF',
            phoneNumberType: PhoneNumberType.MOBILE,
            phoneCode: '937',
            rate: 5.9,
          },
          {
            name: 'AFGHANISTAN - Mobile - AT',
            countryCode: 'AF',
            phoneNumberType: PhoneNumberType.MOBILE,
            phoneCode: '9375',
            rate: 5.9,
          },
        ],
      };

      const { result: actual, error } = sanitizeRateTable(inputTable);

      expect(error).to.not.exist;
      expect(actual).to.eql(expected);
    });

    it('returns "phone code mismatch" error when phone code does not match the country', () => {
      const inputs = [
        {
          name: 'call-rates.csv',
          type: RateTableType.OFFNET_CALL,
          rows: [
            {
              name: 'AFGHANISTAN - Fixed',
              countryCode: 'AF',
              phoneNumberType: PhoneNumberType.LANDLINE,
              phoneCode: '375',
              rate: '5.8859',
            },
          ],
        },
        {
          name: 'call-rates.csv',
          type: RateTableType.OFFNET_CALL,
          rows: [
            {
              name: 'AFGHANISTAN - Mobile',
              countryCode: 'AF',
              phoneNumberType: PhoneNumberType.MOBILE,
              phoneCode: '37529',
              rate: '5.8859',
            },
          ],
        },
      ];

      inputs.forEach(table => {
        const { error } = sanitizeRateTable(table);

        expect(error).to.be.instanceOf(ValidationError);
        const expectedError = _.find(error.errors, { code: CALL_RATE_ERROR.PhoneCodeMismatch });
        expect(expectedError).to.exist;
      });
    });

    it('returns "unknown country code" error when country code is invalid', () => {
      const inputTable = {
        name: 'call-rates.csv',
        type: RateTableType.OFFNET_CALL,
        rows: [
          {
            name: 'AUSTRIA - Fixed',
            countryCode: 'LOL',
            phoneNumberType: PhoneNumberType.LANDLINE,
            phoneCode: '43',
            rate: '5.8859',
          },
        ],
      };

      const { error } = sanitizeRateTable(inputTable);

      expect(error).to.be.instanceOf(ValidationError);
      const expectedError = _.find(error.errors, { code: CALL_RATE_ERROR.UnknownCountryCode });
      expect(expectedError).to.exist;
    });

    it('returns validation error when rows do not match the schema', () => {
      const inputTable = {
        name: 'call-rates.csv',
        type: RateTableType.OFFNET_CALL,
        rows: [
          {
            name: 'AUSTRIA - Fixed',
            countryCode: 'AT',
            phoneNumberType: 'INTERNATIONAL',
            phoneCode: '43',
            rate: '5.8859',
          },
        ],
      };

      const { error } = sanitizeRateTable(inputTable);

      expect(error).to.be.instanceOf(ValidationError);
    });
  });
});
