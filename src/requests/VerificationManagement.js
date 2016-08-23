import { ArgumentNullError } from 'common-errors';
import Joi from 'joi';
import Promise from 'bluebird';

import CpsRequest from './CpsRequest';

const SaveVerificationSchema = Joi.object({
  identifier: Joi.string().required(),
  enabled_verification_methods: Joi.array(),
  two_factor_authentication_code_length: Joi.number(),
  sms_verification_profile: Joi.object().keys({
    origin: Joi.string().alphanum(),
    carrier_sms_profile_name: Joi.string(),
    carrier_sms_identifier: Joi.string(),
    message_content: Joi.object().required(),
  }),
  call_verification_profile: Joi.object().keys({
    mo_access_numbers: Joi.object().keys({
      number: Joi.object().keys({
        national: Joi.string(),
        international: Joi.string(),
      }),
    }),
    mt_allow_mobile_numbers_only: Joi.boolean(),
    mo_allow_mobile_numbers_only: Joi.boolean(),
  }),
  attempt_callback_url: Joi.string(),
  completion_callback_url: Joi.string(),
  description: Joi.string().required(),
  name: Joi.string().required(),
});

export default class VerificationManagement extends CpsRequest {

  static VerificationMethods = {
    SMS: 'SMS',
    IVR: 'IVR',
    MO: 'MobileOriginated',
    MT: 'MobileTerminated',
  };

  saveProfile(carrierId, params) {
    if (!carrierId) {
      return Promise.reject(new ArgumentNullError(carrierId));
    }

    const uri = `/1.0/carriers/${carrierId}/verifications/profiles`;

    const validationError = this.validateParams(params, SaveVerificationSchema);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri, params);
  }
}
