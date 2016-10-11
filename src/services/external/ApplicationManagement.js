import Joi from 'joi';
import CpsRequest from './CpsRequest';

const SaveApplicationSchema = {
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
  bundle_id: Joi.string(),
};

export class ApplicationManagement extends CpsRequest {

  saveApplication(params) {
    const uri = '/1.0/applications';
    const validationError = this.validateParams(params, SaveApplicationSchema);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri, params);
  }
}

export default ApplicationManagement;
