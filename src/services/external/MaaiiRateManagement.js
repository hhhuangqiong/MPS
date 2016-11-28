import CpsRequest from './CpsRequest';
import { ArgumentNullError } from 'common-errors';
import Joi from 'joi';

const postChargingRateSchema = Joi.object({
  startDate: Joi.string().required(),
  endDate: Joi.string().required(),
  type: Joi.string().required(),
  currency: Joi.number().integer(),
  rates: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    packageId: Joi.number().required(),
    homeArea: Joi.string().required(),
    originArea: Joi.string().required(),
    destinationPrefixes: Joi.array().items(Joi.string()),
    connectionFee: Joi.string(),
    rate: Joi.string(),
    rateUnit: Joi.string(),
    blocked: Joi.string(),
  })),
  updatedUser: Joi.string(),
});

export class MaaiiRateManagement extends CpsRequest {
  getChargingRateTables(carrierId, type) {
    if (!carrierId) {
      return Promise.reject(new ArgumentNullError(carrierId));
    }
    if (!type) {
      return Promise.reject(new ArgumentNullError(type));
    }

    const url = `/1.0/carriers/${carrierId}/chargingRates?type=${type}`;
    return this.get(url);
  }
  createChargingRateTable(carrierId, params) {
    if (!carrierId) {
      return Promise.reject(new ArgumentNullError(carrierId));
    }

    const url = `/1.0/carriers/${carrierId}/chargingRates`;
    const validationError = this.validateParams(params, postChargingRateSchema);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }
    return this.post(url, params);
  }
}

export default MaaiiRateManagement;
