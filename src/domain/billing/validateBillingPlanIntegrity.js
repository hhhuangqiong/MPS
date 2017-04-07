import { check } from 'm800-util';
import Joi from 'joi';
import _ from 'lodash';
import { ValidationError } from 'common-errors';

import { RateTableTypes, RateTableType } from './rateTableType';

const REQUIRED_RATE_TABLE_TYPES = [
  RateTableType.OFFNET_CALL,
  RateTableType.SMS,
];

export const BillingPlanValidationErrorType = {
  MissingRateTable: 'billingPlan.missingRateTable',
  BaseCurrencyMismatch: 'billingPlan.baseCurrencyMismatch',
  AmbiguousRateTables: 'billingPlan.ambiguousRateTables',
};

export default function validateBillingPlanIntegrity(plan) {
  check.schema('plan', plan, Joi.object({
    baseCurrency: Joi.number(),
    rateTables: Joi.array().items(Joi.object({
      type: Joi.string().only(RateTableTypes),
    })),
  }));

  const usedTableTypes = _.uniq(plan.rateTables.map(x => x.type));
  if (usedTableTypes.length !== plan.rateTables.length) {
    return new ValidationError(
      'More than one rate table of the same type found.',
      BillingPlanValidationErrorType.AmbiguousRateTables,
      'rateTables',
    );
  }
  const missingTypes = _.difference(REQUIRED_RATE_TABLE_TYPES, usedTableTypes);
  if (missingTypes.length > 0) {
    return new ValidationError(
      `Rate tables of types: ${missingTypes.join(',')} are missing.`,
      BillingPlanValidationErrorType.MissingRateTable,
      'rateTables',
    );
  }
  const exchangeRateTable = _.find(plan.rateTables, { type: RateTableType.CURRENCY_EXCHANGE });
  if (exchangeRateTable && exchangeRateTable.baseCurrency !== plan.baseCurrency) {
    return new ValidationError(
      'Exchange rate table base currency does not match plan base currency.',
      BillingPlanValidationErrorType.BaseCurrencyMismatch,
      'baseCurrency',
    );
  }
  return null;
}
