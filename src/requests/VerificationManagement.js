import Joi from 'joi';
import CpsRequest from './CpsRequest';

export default class VerificationManagement extends CpsRequest {

  saveVerificationProfile({
    carrierId,
    identifier = 'com.maaiii.org.sparkle',
    name = 'com.maaiii.org.sparkle',
    ...restParams,
  }) {
    const uri = `/1.0/carriers/${carrierId}/verifications/profiles`;

    const rules = {
      identifier: Joi.string().required(),
      enabled_verification_methods: Joi.array(),
      two_factor_authentication_code_length: Joi.number(),
      sms_verification_profile: Joi.object().keys({
        origin: Joi.string(),
        carrier_sms_profile_name: Joi.string(),
        carrier_sms_identifier: Joi.string(),
        message_content: Joi.array(),
      }),
      call_verification_profile: Joi.object().keys({
        mo_access_numbers: Joi.object().keys({
          number: Joi.object().keys({
            national: Joi.string(),
            international: Joi.string(),
          }),
        }),
        mo_allow_mobile_numbers_only: Joi.boolean(),
        mt_caller_ids: Joi.array(),
      }),
      attempt_callback_url: Joi.string(),
      completion_callback_url: Joi.string(),
      description: Joi.string(),
      name: Joi.string(),
    };

    const params = {
      ...restParams,
      identifier,
      name,
    };

    const validationError = this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri, params);
  }
}
