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

  enableApiCapability(params = {}) {
    const uri = this.uri;
    const type = 'API';

    const rules = {
      carrierId: Joi.string().required(),
      developer: Joi.object().required(),
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
      developer: params.developer || {},
    });
  }

  enableSmsCapability(params = {}) {
    const uri = this.uri;
    const type = 'SMS';

    const rules = {
      carrierId: Joi.string().required(),
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

    const validationError =
      this.validateType(type) ||
      this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri.replace(':carrierId', params.carrierId), {
      ...params,
      type,
      sms_profile: {
        charging_profile: params.sms_profile.charging_profile || 'm800_charging_profile',
        identifier: params.sms_profile.identifier || `SMS-Profile-${params.carrierId}`,
        attributes: params.sms_profile.attributes,
        name: params.sms_profile.name || `SMSProfile for ${params.carrierId}`,
        description: params.sms_profile.description,
        validate_source_address: params.sms_profile.validate_source_address || true,
        source_address_list: params.sms_profile.source_address_list,
        default_realm: params.sms_profile.default_realm,
        service_plan_id: params.sms_profile.service_plan_id,
        systemType: params.sms_profile.systemType,
        systemId: params.sms_profile.systemId,
        password: params.sms_profile.password,
      },
    });
  }

  enableImToSmsCapability(params = {}) {
    const uri = this.uri;
    const type = 'ImToSms';

    const rules = {
      carrierId: Joi.string().required(),
      im_to_sms_profile: Joi.object().keys({
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

    const validationError =
      this.validateType(type) ||
      this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri.replace(':carrierId', params.carrierId), {
      ...params,
      type,
      im_to_sms_profile: {
        charging_profile: params.im_to_sms_profile.charging_profile || 'maaii_charging_profile',
        identifier: params.im_to_sms_profile.identifier || 'maaii_im_sms_profile',
        attributes: params.im_to_sms_profile.attributes,
        name: params.im_to_sms_profile.name || `SMSProfile for ${params.carrierId}`,
        description: params.im_to_sms_profile.description,
        validate_source_address: params.im_to_sms_profile.validate_source_address,
        source_address_list: params.im_to_sms_profile.source_address_list,
        default_realm: params.im_to_sms_profile.default_realm,
        service_plan_id: params.im_to_sms_profile.service_plan_id,
        systemType: params.im_to_sms_profile.systemType,
        systemId: params.im_to_sms_profile.systemId,
        password: params.im_to_sms_profile.password,
      },
    });
  }

  enableVoiceCapability(params = {}) {
    const uri = this.uri;
    const type = 'Voice';

    const rules = {
      carrierId: Joi.string().required(),
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

    const validationError =
      this.validateType(type) ||
      this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri.replace(':carrierId', params.carrierId), {
      ...params,
      type,
      voice_service_profile: {
        identifier: params.voice_service_profile.identifier || `SIP-Profile-${params.carrierId}`,
        description: params.voice_service_profile.description,
        charging_profile: params.voice_service_profile.charging_profile || 'm800_charging_profile',
        is_onnet_charging_disabled: params.voice_service_profile.is_onnet_charging_disabled,
        is_offet_charging_disabled: params.voice_service_profile.is_offet_charging_disabled,
        routing_profile_id: params.voice_service_profile.routing_profile_id,
        attributes: params.voice_service_profile.attributes || {},
      },
    });
  }
}
