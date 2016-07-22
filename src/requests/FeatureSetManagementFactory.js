import Joi from 'joi';
import isEmpty from 'lodash/isEmpty';
import CpsRequest from './CpsRequest';

export default class FeatureSetManagementFactory extends CpsRequest {
  constructor(baseUrl = '') {
    super(baseUrl);
  }

  getFeatureSetTemplateRequest(uri = '') {
    return (group = '') => {
      if (isEmpty(group)) {
        return Promise.reject(new Error('group is empty'));
      }

      return this.get(`${uri}?group=${group}`);
    };
  }

  createFeatureSetRequest(uri = '') {
    return (params = {}) => {
      if (isEmpty(uri)) {
        return Promise.reject(new Error('uri is empty'));
      }

      const validationError = this.validateParams(params, {
        identifier: Joi.string().required(),
        features: Joi.array().required(),
      });

      if (validationError) {
        return Promise.reject(validationError);
      }

      return this.post(uri, {
        ...params,
        features: params.features || [],
      });
    };
  }
}
