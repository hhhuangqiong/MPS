import Joi from 'joi';
import _ from 'lodash';
import { HttpStatusError, InvalidOperationError, Error } from 'common-errors';

import {
  BossServiceTypes,
  BossPaymentModes,
} from './../../domain';

import BaseRequest from './BaseRequest';


const PREFIX_REGEX = /^[0-9]+$/;

const BossProvisionCreateSchema = Joi.object({
  id: Joi.string().required(),
  accountCode: Joi.string().alphanum().required(),
  accountName: Joi.string().required(),
  country: Joi.string().max(2),
  carrierIdOfReseller: Joi.string().required(),
  carriers: Joi.array().items(Joi.object({
    carrierId: Joi.string().required(),
    serviceType: Joi.string().valid(BossServiceTypes),
    offNetPrefix: Joi.array().items(Joi.string().regex(PREFIX_REGEX)).optional(),
    offNetPrefixTest: Joi.array().items(Joi.string().regex(PREFIX_REGEX)).optional(),
    smsPrefix: Joi.array().items(Joi.string().regex(PREFIX_REGEX)).optional(),
    remarks: Joi.string(),
    currency: Joi.number(),
    m800Ocs: Joi.object({
      sms: Joi.object({
        packageId: Joi.number().required(),
        type: Joi.string().valid(BossPaymentModes).required(),
        initialBalance: Joi.number().min(0).required(),
      }).optional(),
      offnet: Joi.object({
        packageId: Joi.number().required(),
        type: Joi.string().valid(BossPaymentModes).required(),
        initialBalance: Joi.number().min(0).required(),
      }).optional(),
    }),
    capacity: Joi.object({
      transactionCapacity: Joi.number().min(0),
      maxWalletBalance: Joi.number().min(0),
      maxTransactionPerDay: Joi.number().min(0),
    }).optional(),
    promotion: Joi.object({
      startDate: Joi.date().timestamp(),
      endDate: Joi.date().timestamp(),
      amount: Joi.number(),
    }).optional(),
  })),
});

export class BossProvisionManagement extends BaseRequest {

  create(params) {
    const uri = '/api/provision';
    const validationError = this.validateParams(params, BossProvisionCreateSchema);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri, params)
      .catch(this.errorHandler)
      .then(this.checkIsSuccess);
  }

  checkIsSuccess(res) {
    const { success, error } = res.body;
    if (!success) {
      const { description, code } = error;
      const err = new InvalidOperationError(description);
      err.code = code;
      throw err;
    }

    return res;
  }

  errorHandler(error) {
    const isHttpStatusError = !_.isEmpty(error.body);

    if (isHttpStatusError) {
      const parsedError = new HttpStatusError(error.status, `${error.body.id} - ${error.body.error}`);
      throw parsedError;
    }

    let responseError;
    try {
      responseError = JSON.parse(error.res.text).error;
    } catch (e) {
      throw new ReferenceError('Unexpected response from BOSS: ', _.get(error, 'res', undefined), e);
    }

    let parsedError;
    switch (responseError.code) {
      case 10001:
        parsedError = new InvalidOperationError(responseError.description);
        break;
      default:
        parsedError = new Error(responseError.description);
    }
    parsedError.code = responseError.code;

    throw parsedError;
  }
}

export default BossProvisionManagement;
