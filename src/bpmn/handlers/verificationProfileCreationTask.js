import _ from 'lodash';
import { ArgumentNullError, ReferenceError } from 'common-errors';

import { check } from './../../util';
import {
  Capability,
  VerificationMethod,
  CpsCapabilityType,
} from './../../domain';
import { VERIFICATION_PROFILE_CREATION } from './bpmnEvents';

export function createVerificationProfileCreationTask(templateService, verificationManagement, capabilitiesManagement) {
  check.ok('templateService', templateService);
  check.ok('verificationManagement', verificationManagement);
  check.ok('capabilitiesManagement', capabilitiesManagement);


  const VerificationCapabilities = [
    Capability.VERIFICATION_MO,
    Capability.VERIFICATION_MT,
    Capability.VERIFICATION_SMS,
    Capability.VERIFICATION_IVR,
  ];

  function needActivation(capabilities) {
    return _.intersection(capabilities, VerificationCapabilities).length > 0;
  }

  function generateVerificationMethods(capabilities) {
    const verificationCapabilities = _.intersection(capabilities, VerificationCapabilities);
    return _.map(verificationCapabilities, (capability) => {
      switch (capability) {
        case Capability.VERIFICATION_IVR:
          return VerificationMethod.IVR;
        case Capability.VERIFICATION_MO:
          return VerificationMethod.MO;
        case Capability.VERIFICATION_MT:
          return VerificationMethod.MT;
        case Capability.VERIFICATION_SMS:
          return VerificationMethod.SMS;
        default:
          return undefined;
      }
    });
  }

  async function generateVerificationProfile(params) {
    const { capabilities } = params;
    const verificationMethods = generateVerificationMethods(capabilities);
    const profile = await templateService.render('cps.verification', { ...params });
    profile.enabled_verification_methods = verificationMethods;
    return profile;
  }

  async function getSmsProfileIdentifier(carrierId) {
    const res = await capabilitiesManagement.getProfile(carrierId, CpsCapabilityType.SMS);
    const { identifier } = res.body;
    if (!identifier) {
      throw new ReferenceError('Unexpected response from CPS: `identifier` missing in sms profile');
    }
    return identifier;
  }

  async function createVerificationProfile(state, profile, context) {
    if (state.results.verificationProfileId) {
      return null;
    }
    const { logger } = context;
    const { carrierId } = state.results;
    const { capabilities } = profile;

    if (!needActivation(capabilities)) {
      logger.info('Verification Profile Creation skipped no capabilities requires.');
      return null;
    }
    if (!carrierId) {
      throw new ArgumentNullError('carrierId');
    }
    const params = {
      ...state.results,
      ...profile,
    };
    if (capabilities.includes(Capability.VERIFICATION_SMS)) {
      const smsProfileIdentifier = await getSmsProfileIdentifier(carrierId);
      if (!smsProfileIdentifier) {
        throw new ArgumentNullError('smsProfileIdentifier');
      }
      params.smsProfileIdentifier = smsProfileIdentifier;
    }
    const verificationProfile = await generateVerificationProfile(params);
    const response = await verificationManagement.saveProfile(carrierId, verificationProfile);
    const { id: verificationProfileId } = response.body;
    if (!verificationProfileId) {
      throw new ReferenceError('id not defined in response from carrier profile creation');
    }
    return {
      results: {
        verificationProfileId,
      },
    };
  }

  createVerificationProfile.$meta = {
    name: VERIFICATION_PROFILE_CREATION,
  };

  return createVerificationProfile;
}

export default createVerificationProfileCreationTask;
