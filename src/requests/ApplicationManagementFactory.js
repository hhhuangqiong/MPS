import Joi from 'joi';
import uuid from 'uuid';
import isEmpty from 'lodash/isEmpty';
import CpsRequest from './CpsRequest';

export default class ApplicationManagementFactory extends CpsRequest {
  constructor(baseUrl = '') {
    super(baseUrl);
  }

  saveApplicationRequest(uri = '') {
    return (params = {}) => {
      if (isEmpty(uri)) {
        return Promise.reject(new Error('uri is empty'));
      }

      const rules = {
        identifier: Joi.string().required(),
        name: Joi.string(),
        description: Joi.string(),
        application_versions: Joi.array().items(
          Joi.object().keys({
            version_numbers: Joi.object().keys({
              version_major: Joi.number().required(),
              version_minor: Joi.number().required(),
              version_patch: Joi.number().required(),
            }).required(),
            version_status: Joi.string().valid('RELEASED', 'UN_RELEASED').required(),
            feature_set_identifier: Joi.string().required(),
          }).required()
        ).required(),
        platform: Joi.string().required(),
        developer: Joi.string().required(),
        download_url: Joi.string(),
        status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'BLOCKED').required(),
        application_key: Joi.string(),
        application_secret: Joi.string(),
        attributes: Joi.string(),
        bundle_id: Joi.string().required(),
      };

      const validationError = this.validateParams(params, rules);

      if (validationError) {
        return Promise.reject(validationError);
      }

      return this.post(uri.replace(':carrierId', params.carrierId), {
        ...params,
        name: params.name || params.identifier,
        application_key: params.application_key || `mapp${uuid.v1()}`,
        application_secret: params.application_secret || uuid.v1(),
      });
    };
  }
}
