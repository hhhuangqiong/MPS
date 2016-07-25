import Joi from 'joi';
import isEmpty from 'lodash/isEmpty';
import { ArgumentNullError } from 'common-errors';

import CpsRequest from './CpsRequest';

export default class FeatureSetManagementFactory extends CpsRequest {
  constructor(baseUrl = '') {
    super(baseUrl);
  }

  getFeatureSetTemplateRequest(uri = '') {
    return (group = '') => {
      if (isEmpty(group)) {
        return this.validationErrorHandler(new ArgumentNullError('group'));
      }

      return this.get(`${uri}?group=${group}`);
    };
  }

  createFeatureSetRequest(uri = '') {
    return (params = {}) => {
      const validationError = this.validateParams(params, {
        identifier: Joi.string().required(),
        features: Joi.array().required(),
      });

      if (validationError) {
        return this.validationErrorHandler(validationError);
      }

      return this.post(uri, {
        ...params,
        features: params.features || [],
      });
    };
  }
}
