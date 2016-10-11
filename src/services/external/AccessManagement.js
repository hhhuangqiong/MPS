import Joi from 'joi';
import _ from 'lodash';
import { HttpStatusError } from 'common-errors';

import BaseRequest from './BaseRequest';

const CreateRoleSchema = Joi.object({
  name: Joi.string().required(),
  service: Joi.string().required(),
  company: Joi.string().required(),
  permissions: Joi.object().required(),
});

export class AccessManagement extends BaseRequest {

  createRole(params) {
    const uri = '/access/roles';
    const validationError = this.validateParams(params, CreateRoleSchema);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri, params)
      .catch(this.errorHandler);
  }

  errorHandler(error) {
    const isHttpStatusError = !_.isEmpty(error.body);

    if (isHttpStatusError) {
      const parsedError = new HttpStatusError(error.status, `${error.body.id} - ${error.body.error}`);
      throw parsedError;
    }

    throw error;
  }
}

export default AccessManagement;
