import { Types } from 'mongoose';
import { expect } from 'chai';
import { ValidationError } from 'common-errors';
import _ from 'lodash';
import currency from 'currency-codes';

import {
  validateBillingPlanIntegrity,
  BillingPlanValidationErrorType,
  RateTableType,
  PhoneNumberType,
} from './../../../src/domain';

describe('domain/billing/validateBillingPlanIntegrity', () => {
  const SAMPLE_BILLING_PLAN = {
    name: 'Plan A',
    baseCurrency: _.parseInt(currency.code('USD').number),
    companyId: new Types.ObjectId(),
    rateTables: [
      {
        id: new Types.ObjectId(),
        type: RateTableType.CURRENCY_EXCHANGE,
        name: 'exchange-rates.csv',
        baseCurrency: _.parseInt(currency.code('USD').number),
        rows: [
          {
            name: 'EUR',
            code: _.parseInt(currency.code('EUR').number),
            rate: 1.1,
          },
          {
            name: 'HKD',
            code: _.parseInt(currency.code('HKD').number),
            rate: 7.2,
          },
        ],
      },
      {
        id: new Types.ObjectId(),
        type: RateTableType.SMS,
        name: 'sms-rates.csv',
        rows: [
          { name: 'Albania', phoneCode: '355', rate: 2.5 },
          { name: 'Hong Kong', phoneCode: '852', rate: 3.6 },
        ],
      },
      {
        id: new Types.ObjectId(),
        type: RateTableType.OFFNET_CALL,
        name: 'off-net-calls.csv',
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
        ],
      },
    ],
  };

  it('returns null when billing plan is valid', () => {
    const error = validateBillingPlanIntegrity(SAMPLE_BILLING_PLAN);
    expect(error).to.be.null;
  });

  it('returns "base currency mismatch" error when exchange rate table has another base currency', () => {
    const billingPlan = _.cloneDeep(SAMPLE_BILLING_PLAN);
    billingPlan.baseCurrency = _.parseInt(currency.code('BYR').number);

    const error = validateBillingPlanIntegrity(billingPlan);
    expect(error).to.be.instanceOf(ValidationError);
    expect(error.code).to.equal(BillingPlanValidationErrorType.BaseCurrencyMismatch);
  });

  it('returns "missing rate table" error when some of required rate tables are missing', () => {
    const billingPlan = _.cloneDeep(SAMPLE_BILLING_PLAN);
    billingPlan.rateTables = billingPlan.rateTables.filter(x => x.type === RateTableType.SMS);

    const error = validateBillingPlanIntegrity(billingPlan);
    expect(error).to.be.instanceOf(ValidationError);
    expect(error.code).to.equal(BillingPlanValidationErrorType.MissingRateTable);
  });

  it('returns "ambiguous rate table" error when multiple rate tables of the same type are in plan', () => {
    const billingPlan = _.cloneDeep(SAMPLE_BILLING_PLAN);
    const smsRateTable = _.find(billingPlan.rateTables, { type: RateTableType.SMS });
    smsRateTable.type = RateTableType.OFFNET_CALL;

    const error = validateBillingPlanIntegrity(billingPlan);
    expect(error).to.be.instanceOf(ValidationError);
    expect(error.code).to.equal(BillingPlanValidationErrorType.AmbiguousRateTables);
  });
});
