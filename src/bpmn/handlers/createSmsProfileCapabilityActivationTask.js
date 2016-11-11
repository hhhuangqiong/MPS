import _ from 'lodash';
import Joi from 'joi';
import { ReferenceError, ArgumentNullError } from 'common-errors';

import { check } from './../../util';
import { Capability, CapabilityType } from './../../domain';
import { compileJsonTemplate } from './common';

export function createSmsProfileCapabilityActivationTask(cpsOptions, capabilitiesManagement, requiredCapabilities) {
  check.ok('cpsOptions', cpsOptions);
  check.ok('capabilitiesManagement', capabilitiesManagement);
  requiredCapabilities = check.schema('requiredCapabilities', requiredCapabilities, Joi.object({
    internal: Joi.array()
      .items(Joi.string().allow([Capability.IM_TO_SMS, Capability.VERIFICATION_SMS]))
      .single()
      .required(),
    external: Joi.string().allow([CapabilityType.IM_TO_SMS, CapabilityType.SMS]).required(),
    template: Joi.object(),
  }));

  async function activateCapability(state, profile) {
    const { carrierId, capabilities, smsRealmId, smsServicePlanId } = state.results;
    const { smsc } = profile;
    const alreadyActivated = _.difference(requiredCapabilities.internal, capabilities).length === 0;
    if (alreadyActivated) {
      return null;
    }
    const shouldBeActivated = _.intersection(profile.capabilities, requiredCapabilities.internal).length !== 0;
    if (!shouldBeActivated) {
      return null;
    }

    const chargeProfiles = {
      companyChargeProfile: cpsOptions.chargeProfile.company,
      userChargeProfile: cpsOptions.chargeProfile.user,
    };

    const data = {
      ...state.results,
      ...profile,
    };
    const smsProfile = compileJsonTemplate(requiredCapabilities.template, _.extend(data, chargeProfiles));

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
      requiredCapabilities.external,
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
      },
    };
  }
  return activateCapability;
}

export default createSmsProfileCapabilityActivationTask;
