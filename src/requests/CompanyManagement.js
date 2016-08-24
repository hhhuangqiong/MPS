import Joi from 'joi';
import request from 'superagent-bluebird-promise';
import _ from 'lodash';
import { HttpStatusError, ConnectionError } from 'common-errors';
import logger from '../utils/logger';

const contactSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
});

const schema = Joi.object({
  parent: Joi.string().required(),
  country: Joi.string().optional(),
  reseller: Joi.boolean().default(false),
  name: Joi.string().required(),
  themeType: Joi.string().optional(),
  address: Joi.object({
    formatted: Joi.string().optional(),
    streetAddress: Joi.string().optional(),
    country: Joi.string().optional(),
  }).optional(),
  timezone: Joi.string().required(),
  accountManager: Joi.string().optional(),
  businessContact: Joi.array().items(contactSchema).optional(),
  technicalContact: Joi.array().items(contactSchema).optional(),
  supportContact: Joi.array().items(contactSchema).optional(),
});


export default class CompanyManagement {
  constructor({ baseUrl, timeout, validator }) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.validator = validator;
  }

  createCompany(params) {
    const query = this.validator.sanitize(params, schema);
    const uri = `${this.baseUrl}/identity/companies`;
    logger(`Making IAM create company request to ${uri}. With query`, query);

    return request.post(uri)
      .timeout(this.timeout)
      .send(query)
      .set('Accept', 'application/json')
      .promise()
      .catch(this.errorHandler);
  }

  errorHandler(error) {
    const body = error.res.body;
    const statusCode = error.status;
    const isIamError = !_.isEmpty(body);

    if (isIamError) {
      // propagate iam error
      logger('Error occured in IAM operation, propagated: ', error);
      const parsedError = new HttpStatusError(statusCode, error.message);
      parsedError.code = error.code;

      throw parsedError;
    }

    if (error.timeout) {
      logger('warn', `Request timed out at ${error.timeout} on request to IAM ${this.baseUrl}`);
      throw new ConnectionError(`Connect to IAM(${this.baseUrl}) failue`, error);
    }

    // Unknown Error
    logger('warn', 'Unkown error occured during request to IAM');
    throw new Error('Unknown error during request');
  }
}
