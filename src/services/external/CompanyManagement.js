import Joi from 'joi';
import _ from 'lodash';
import { HttpStatusError, ConnectionError } from 'common-errors';

import BaseRequest from './BaseRequest';

const contactSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
});

const schema = Joi.object({
  parent: Joi.string().required(),
  country: Joi.string().required(),
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


export class CompanyManagement extends BaseRequest {

  createCompany(params) {
    const uri = '/identity/companies';
    const validationError = this.validateParams(params, schema);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri, params)
      .catch(e => this.errorHandler(e));
  }

  postCompanyLogo(id, logo) {
    const uri = `/identity/companies/${id}/logo`;
    return this.postFile(uri, 'logo', logo)
      .catch(e => this.errorHandler(e));
  }

  errorHandler(error) {
    const body = error.res.body;
    const statusCode = error.status;
    const isIamError = !_.isEmpty(body);

    if (isIamError) {
      // propagate iam error
      this.logger.warning('Error occured in IAM operation, propagated: ', error);
      const parsedError = new HttpStatusError(statusCode, error.message);
      parsedError.code = error.code;

      throw parsedError;
    }

    if (error.timeout) {
      this.logger.warning(`Request timed out at ${error.timeout} on request to IAM ${this.baseUrl}`);
      throw new ConnectionError(`Connect to IAM(${this.baseUrl}) failue`, error);
    }

    // Unknown Error
    this.logger.warning('Unkown error occured during request to IAM');
    throw new Error('Unknown error during request');
  }
}

export default CompanyManagement;
