import Joi from 'joi';
import CpsRequest from './CpsRequest';

function getMatchAllMatcherRule() {
  return Joi.object().keys({
    type: Joi.string().required(),
    description: Joi.string(),
  });
}

function getRegExFieldMatcherRule() {
  return Joi.object().keys({
    type: Joi.string().required(),
    description: Joi.string(),
    field_name: Joi.string().required(),
    regular_expression: Joi.string().required(),
    invalid_matcher: Joi.boolean(),
  });
}

function getSourceNetworkMatcherRule() {
  return Joi.object().keys({
    type: Joi.string().required(),
    description: Joi.string(),
    network_address: Joi.string().required(),
    network_mask: Joi.string().required(),
  });
}

function getManipulationRule() {
  return Joi.object().keys({
    description: Joi.string(),
    matcher: Joi.any().required(),
    manipulator: Joi.any().required(),
    stop_execution: Joi.boolean(),
  });
}

function getOffNetCallManipulatorRule() {
  return Joi.object().keys({
    type: Joi.string().required(),
    description: Joi.string(),
    // currently it will be generated by the system
    gateway_prefix: Joi.string(),
    from_address: Joi.string().required(),
    p_asserted_id: Joi.string(),
    is_one_card_multiple_no: Joi.boolean().required(),
    enabled: Joi.boolean().required(),
    is_passerted_id_enabled: Joi.boolean(),
  });
}

function getRegExFieldManipulatorRule() {
  return Joi.object().keys({
    type: Joi.string().required(),
    description: Joi.string(),
    field_name: Joi.string(),
    regular_expression: Joi.string(),
    replacements: Joi.array(),
    invalid_manipulator: Joi.boolean(),
  });
}

export default class VoiceProvisioningManagement extends CpsRequest {
  constructor(baseUrl = '') {
    super(baseUrl);
  }

  // 1. SIP Routing Profile Creation
  sipRoutingProfileCreation(params = {}) {
    const uri = '/1.0/sip/routing_profiles';

    const rules = {
      identifier: Joi.string().required(),
      name: Joi.string(),
      description: Joi.string(),
      attributes: Joi.array(),
      trunks: Joi.array().items(
        Joi.object().keys({
          matchers: Joi.array().items(
            getMatchAllMatcherRule(),
            getRegExFieldMatcherRule(),
            getSourceNetworkMatcherRule()
          ).required(),
          manipulation_rules: Joi.array().items(
            getManipulationRule(),
            getRegExFieldManipulatorRule(),
            getOffNetCallManipulatorRule()
          ),
          gateway_selection_rules: Joi.array().items(
            Joi.object().keys({
              description: Joi.string(),
              matcher: Joi.object().required(),
              gateway: Joi.string().required(),
              stop_execution: Joi.string(),
            })
          ),
          attributes: Joi.array(),
        })
      ).required(),
    };

    const validationError = this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri, params);
  }

  // 2. SIP Gateway Creation
  sipGatewayCreation({
    disable = false,
    protocol = 'SIP',
    timeout = 0,
    ...restParams,
  }) {
    const uri = '/1.0/sip/gateways';

    const rules = {
      identifier: Joi.string().required(),
      description: Joi.string(),
      manipulation_rules: Joi.array().items(getManipulationRule()),
      name: Joi.string(),
      protocol: Joi.string().valid('SIP', 'SS7'),
      host: Joi.string().required(),
      disable: Joi.boolean(),
      attributes: Joi.array(),
      trunk_id: Joi.string(),
      port: Joi.number().required(),
      timeout: Joi.number(),
    };

    const params = {
      ...restParams,
      disable,
      protocol,
      timeout,
    };

    const validationError = this.validateParams(params, rules);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri, params);
  }
}
