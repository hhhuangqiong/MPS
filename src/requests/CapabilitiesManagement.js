import Joi from 'joi';
import CpsRequest from './CpsRequest';

import {
  TypeError,
} from 'common-errors';

export default class CapabilitiesManagement extends CpsRequest {
  constructor(baseUrl = '') {
    super(baseUrl);
    this.uri = '/1.0/carriers/:carrierId/capabilities';
  }

  validateType(type) {
    if (typeof type === 'string') {
      return null;
    }

    return new TypeError('capability type is not a string');
  }

  enableCapabilityByType(type = '', params = {}) {
    const uri = this.uri;

    const rules = {
      carrierId: Joi.string().required(),
    };

    const validationError =
      this.validateType(type) ||
      this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri.replace(':carrierId', params.carrierId), {
      ...params,
      type,
    });
  }

  enableApiCapability({
    developer = {},
    ...restParams,
  }) {
    const uri = this.uri;
    const type = 'API';

    const rules = {
      carrierId: Joi.string().required(),
      type: Joi.string().required(),
      developer: Joi.object().required(),
    };

    const params = {
      ...restParams,
      type,
      developer,
    };

    const validationError =
      this.validateType(type) ||
      this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri.replace(':carrierId', params.carrierId), params);
  }

  enableSmsCapability({
    carrierId,
    /* eslint-disable camelcase */
    charging_profile = 'm800_charging_profile',
    validate_source_address = true,
    /* eslint-enable */
    identifier = `SMS-Profile-${carrierId}`,
    name = `SMSProfile for ${carrierId}`,
    ...restParams,
  }) {
    const uri = this.uri;
    const type = 'SMS';

    const rules = {
      carrierId: Joi.string().required(),
      type: Joi.string().required(),
      sms_profile: Joi.object().keys({
        charging_profile: Joi.string(),
        identifier: Joi.string(),
        attributes: Joi.object(),
        name: Joi.string(),
        description: Joi.string(),
        validate_source_address: Joi.boolean(),
        source_address_list: Joi.array(),
        default_realm: Joi.string(),
        service_plan_id: Joi.string(),
        systemType: Joi.string(),
        systemId: Joi.string(),
        password: Joi.string(),
      }).required(),
    };

    const params = {
      carrierId,
      type,
      sms_profile: {
        ...restParams,
        identifier,
        name,
        charging_profile,
        validate_source_address,
      },
    };

    const validationError =
      this.validateType(type) ||
      this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri.replace(':carrierId', params.carrierId), params);
  }

  enableImToSmsCapability({
    carrierId,
    identifier = 'maaii_im_sms_profile',
    name = `SMSProfile for ${carrierId}`,
    /* eslint-disable camelcase */
    charging_profile = 'maaii_charging_profile',
    /* eslint-enable */
    ...restParams,
  }) {
    const uri = this.uri;
    const type = 'ImToSms';

    const rules = {
      carrierId: Joi.string().required(),
      type: Joi.string().required(),
      sms_profile: Joi.object().keys({
        charging_profile: Joi.string(),
        identifier: Joi.string(),
        attributes: Joi.object(),
        name: Joi.string(),
        description: Joi.string(),
        validate_source_address: Joi.boolean(),
        source_address_list: Joi.array(),
        default_realm: Joi.string(),
        service_plan_id: Joi.string(),
        systemType: Joi.string(),
        systemId: Joi.string(),
        password: Joi.string(),
      }),
    };

    const params = {
      carrierId,
      type,
      sms_profile: {
        ...restParams,
        charging_profile,
        identifier,
        name,
      },
    };

    const validationError =
      this.validateType(type) ||
      this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri.replace(':carrierId', params.carrierId), params);
  }

  enableVoiceCapability({
    carrierId,
    identifier = `SIP-Profile-${carrierId}`,
    attributes = {},
    /* eslint-disable camelcase */
    charging_profile = 'm800_charging_profile',
    /* eslint-enable */
    ...restParams,
  }) {
    const uri = this.uri;
    const type = 'Voice';

    const rules = {
      carrierId: Joi.string().required(),
      type: Joi.string().required(),
      voice_service_profile: Joi.object().keys({
        identifier: Joi.string(),
        description: Joi.string(),
        charging_profile: Joi.string(),
        is_onnet_charging_disabled: Joi.boolean().required(),
        is_offet_charging_disabled: Joi.boolean(),
        routing_profile_id: Joi.string(),
        attributes: Joi.object(),
      }),
    };

    const params = {
      carrierId,
      type,
      voice_service_profile: {
        ...restParams,
        identifier,
        charging_profile,
        attributes,
      },
    };

    const validationError =
      this.validateType(type) ||
      this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri.replace(':carrierId', params.carrierId), params);
  }
}
