import _ from 'lodash';
import Joi from 'joi';
import { ReferenceError, ArgumentNullError } from 'common-errors';
import { check } from 'm800-util';

import { Capability, CapabilityType } from './../../domain';

export function createSmsProfileCapabilityActivationTask(templateService, capabilitiesManagement, capabilityOptions) {
  check.ok('templateService', templateService);
  check.ok('capabilitiesManagement', capabilitiesManagement);
  capabilityOptions = check.sanitizeSchema('capabilityOptions', capabilityOptions, Joi.object({
    requirements: Joi.array()
      .items(Joi.string().allow([Capability.IM_TO_SMS, Capability.VERIFICATION_SMS]))
      .single()
      .required(),
    internal: Joi.string().allow([Capability.IM_TO_SMS, Capability.VERIFICATION_SMS]).required(),
    external: Joi.string().allow([CapabilityType.IM_TO_SMS, CapabilityType.SMS]).required(),
    templateKey: Joi.string().required(),
  }));

  async function activateCapability(state, profile) {
    const { carrierId, capabilities, smsRealmId, smsServicePlanId } = state.results;
    const { smsc } = profile;
    const alreadyActivated = _.includes(capabilities, capabilityOptions.internal);
    if (alreadyActivated) {
      return null;
    }
    const shouldBeActivated = _.intersection(profile.capabilities, capabilityOptions.requirements).length !== 0;
    if (!shouldBeActivated) {
      return null;
    }
    const chargeProfileTemplate = await templateService.get('cps.chargeProfile');

    const chargeProfiles = {
      companyChargeProfile: chargeProfileTemplate.company,
      userChargeProfile: chargeProfileTemplate.user,
    };

    const data = {
      ...state.results,
      ...profile,
    };
    const smsProfile = await templateService.render(capabilityOptions.templateKey, _.extend(data, chargeProfiles));
    if (!smsc) {
      throw new ArgumentNullError('smsc');
    } else {
      // sms profile for
      smsProfile.attributes = {
        PREFIX: '',
      };
      smsProfile.default_realm = smsRealmId || smsc.defaultRealm;
      smsProfile.service_plan_id = smsServicePlanId || smsc.servicePlanId;
      smsProfile.source_address_list = [{ as_number: smsc.sourceAddress }];
    }

    const res = await capabilitiesManagement.enableSmsProfileCapability(
      capabilityOptions.external,
      carrierId,
      smsProfile
    );

    const { id: smsProfileId } = res.body;

    if (!smsProfileId) {
      throw new ReferenceError('Unexpected response from CPS sms activation: id missing');
    }
    return {
      results: {
        smsProfileId,
        capabilities: capabilities.concat([capabilityOptions.internal]),
      },
    };
  }
  return activateCapability;
}

export default createSmsProfileCapabilityActivationTask;
