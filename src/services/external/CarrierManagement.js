import Joi from 'joi';
import CpsRequest from './CpsRequest';

export class CarrierManagement extends CpsRequest {
  // 1. Carrier Creation
  createCarrier({
    identifier,
    name = identifier,
    alias = identifier,
    ...restParams
  }) {
    const uri = '/1.0/carriers';
    const rules = {
      // alias is an alias of company_code
      alias: Joi.string().required(),

      identifier: Joi.string().required(),
      name: Joi.string(),
      description: Joi.string(),
      overridden_attributes: Joi.array(),
      profile_name: Joi.string(),
      profile_id: Joi.string(),
      partnership_restrictiveness: Joi
        .string().uppercase()
        .valid('WHITE_LIST', 'BLACK_LIST', 'NON_RESTRICTED'),
      partner_carriers_id: Joi.array(),
      user_naming_convention: Joi.string(),
      enable_contact_store: Joi.boolean(),
      ims_carrier_name: Joi.string(),
      virtual_prefix: Joi.string(),
      extension_points: Joi.array().items(
        Joi.object().keys({
          key: Joi.object().keys({
            extension: Joi.string(),
            api_version: Joi.string(),
            endpoint_uri: Joi.string(),
          }),
        })
      ),
      // null is a valid value for service_type
      service_type: Joi.string().uppercase().valid('SDK', null),
      system_user_id: Joi.string(),
      carrier_capabilities: Joi.array().items(
        Joi.object().keys({
          capabilities: Joi.array().items(
            Joi.object().keys({
              identifier: Joi.string().valid(
                'com.maaii.carrier.capability.voice',
                'com.maaii.carrier.capability.im',
                'com.maaii.carrier.capability.push',
                'com.maaii.carrier.capability.api',
                'com.maaii.carrier.capability.topup',
                'com.maaii.carrier.capability.offnet',
                'com.maaii.carrier.capability.onnet'
              ),
            })
          ),
          suspended: Joi.boolean(),
        })
      ),
      sms_profile_identifier: Joi.string(),
      im_to_sms_profile_identifier: Joi.string(),
      voice_service_profile: Joi.string(),
      credit_earning_profile: Joi.string(),
      widget_service: Joi.object().keys({
        identifier: Joi.string(),
        base_region: Joi.string(),
      }),
      verification_profile_identifier: Joi.string(),
    };

    const params = {
      ...restParams,
      identifier,
      name,
      alias,
    };

    const validationError = this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri, params);
  }

  // 2. Carrier Profile Creation
  createCarrierProfile({
    carrierId,
    name = `Carrier Profile for ${carrierId}`,
    description = carrierId,
    ...restParams
  }) {
    const endpoint = '/1.0/carriers/:carrierId/profiles';

    const rules = {
      carrierId: Joi.string().required(),
      name: Joi.string(),
      description: Joi.string(),
      attributes: Joi.object().keys({
        'com|maaii|management|validation|sms|code|length': Joi.string().required(),
        'com|maaii|im|group|participant|max': Joi.string().required(),
        'com|maaii|service|voip|route': Joi.string().required(),
      }),
    };

    const params = {
      ...restParams,
      carrierId,
      name,
      description,
    };

    const validationError = this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(endpoint.replace(':carrierId', params.carrierId), params);
  }

  // 3. User Carrier Profile Creation
  createUserCarrierProfile({
    carrierId,
    name = `Carrier Profile for ${carrierId}`,
    description = carrierId,
    /* eslint-disable camelcase */
    default_for_nonlisted_countries = true,
    /* eslint-enable */
    ...restParams
  }) {
    const endpoint = '/1.0/carriers/:carrierId/users/profiles';

    const rules = {
      carrierId: Joi.string().required(),
      name: Joi.string(),
      description: Joi.string(),
      default_for_nonlisted_countries: Joi.boolean(),
      attributes: Joi.object().keys({
        'com|maaii|service|voip|ice|disabled': Joi.string().required(),
        'com|maaii|service|voip|enabled': Joi.string().required(),
        'com|maaii|user|type|preapaid': Joi.string().required(),
        'com|maaii|application|credit|upperlimit': Joi.string().required(),
        'com|maaii|application|earning|Email|amount': Joi.string().required(),
        'com|maaii|application|earning|FBpost|amount': Joi.string().required(),
        'com|maaii|application|earning|Twitterpost|amount': Joi.string().required(),
        'com|maaii|application|earning|WBpost|amount': Joi.string().required(),
        'com|maaii|application|earning|enabled': Joi.string().required(),
        'com|maaii|application|earning|random|enabled': Joi.string().required(),
        'com|maaii|application|earning|rateus|amount': Joi.string().required(),
        'com|maaii|application|earning|smsinvite|amount': Joi.string().required(),
        'com|maaii|service|voip|packetlossthreshold': Joi.string().required(),
      }),
    };

    const params = {
      ...restParams,
      carrierId,
      name,
      description,
      default_for_nonlisted_countries,
    };

    const validationError = this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(endpoint.replace(':carrierId', params.carrierId), params);
  }
}

export default CarrierManagement;
