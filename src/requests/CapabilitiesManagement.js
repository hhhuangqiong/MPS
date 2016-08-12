import Joi from 'joi';
import CpsRequest from './CpsRequest';

import {
  TypeError,
} from 'common-errors';

export default class CapabilitiesManagement extends CpsRequest {
  constructor(baseUrl = '') {
    super(baseUrl);
    // this.uri = '/1.0/carriers/:carrierId/capabilities';
  }

  validateType(type) {
    if (typeof type === 'string') {
      return null;
    }

    return new TypeError('capability type is not a string');
  }

  enableCapabilityByType(type = '', params = {}) {
    const uri = '/1.0/carriers/:carrierId/capabilities';

    const rules = {
      carrierId: Joi.string().required(),
    };

    const validationError =
      this.validateType(type) ||
      this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri.replace(':carrierId', params.carrierId), params);
  }

  enableApiCapability(params = {}) {
    const uri = '/1.0/carriers/:carrierId/capabilities';
    const type = 'API';

    const rules = {
      carrierId: Joi.string().required(),
      charging_profile: Joi.string(),
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
      charging_profile: params.charging_profile || 'm800_charging_profile',
    });
  }

  enableSmsCapability(params = {}) {
    const uri = '/1.0/carriers/:carrierId/capabilities';
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
        charging_profile: params.charging_profile || 'm800_charging_profile',
        identifier: params.identifier || `SMS-Profile-${params.carrierId}`,
        attributes: params.attributes || {},
        name: params.name || `SMSProfile for ${params.carrierId}`,
        description: params.description,
        validate_source_address: params.validate_source_address || true,
        source_address_list: params.source_address_list || [],
        default_realm: params.default_realm,
        service_plan_id: params.service_plan_id,
        systemType: params.systemType,
        systemId: params.systemId,
        password: params.password,
      },
    });
  }

  enableImToSmsCapability(params = {}) {
    const uri = '/1.0/carriers/:carrierId/capabilities';
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
        charging_profile: params.charging_profile || 'maaii_charging_profile',
        identifier: params.identifier || 'maaii_im_sms_profile',
        attributes: params.attributes || {},
        name: params.name || `SMSProfile for ${params.carrierId}`,
        description: params.description,
        validate_source_address: params.validate_source_address || false,
        source_address_list: params.source_address_list || [],
        default_realm: params.default_realm,
        service_plan_id: params.service_plan_id,
        systemType: params.systemType,
        systemId: params.systemId,
        password: params.password,
      },
    });
  }

  enableVoiceCapability(params = {}) {
    const uri = '/1.0/carriers/:carrierId/capabilities';
    const type = 'Voice';

    const rules = {
      carrierId: Joi.string().required(),
      voice_service_profile: Joi.object().keys({
        identifier: Joi.string(),
        description: Joi.string(),
        charging_profile: Joi.string(),
        is_onnet_charging_disabled: Joi.boolean(),
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
        identifier: params.identifier || `SIP-Profile-${params.carrierId}`,
        description: params.description,
        charging_profile: params.charging_profile || 'm800_charging_profile',
        is_onnet_charging_disabled: params.is_onnet_charging_disabled,
        is_offet_charging_disabled: params.is_offet_charging_disabled,
        routing_profile_id: params.routing_profile_id,
        attributes: params.attributes || {},
      },
    });
  }
}
