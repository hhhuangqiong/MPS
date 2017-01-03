import _ from 'lodash';
import { ReferenceError } from 'common-errors';
import { check } from 'm800-util';

import { VOICE_CAPABILITY_ACTIVATION } from './bpmnEvents';
import { Capability } from './../../domain';

export function createVoiceCapabilityActivationTask(templateService, capabilitiesManagement) {
  check.ok('templateService', templateService);
  check.ok('capabilitiesManagement', capabilitiesManagement);

  // from definition, voice should be enabled on either ONNET/OFFNET/MAAIN_IN is
  // enabled in provisioning profile
  function needActivation(capabilities) {
    const any = [
      Capability.CALL_ONNET,
      Capability.CALL_OFFNET,
      Capability.CALL_MAAII_IN,
    ];
    return _.intersection(capabilities, any).length > 0;
  }

  async function activateVoice(state, profile) {
    if (state.results.voiceProfileId) {
      return null;
    }
    const { carrierId, sipRoutingProfileId } = state.results;
    const { capabilities } = profile;

    if (!needActivation(capabilities)) {
      return null;
    }

    const enableOnnetCharging = _.includes(capabilities, Capability.CALL_ONNET);
    const enableOffnetCharging = _.includes(capabilities, Capability.CALL_OFFNET);
    // should be specified in form for Phase 2. defaults to company level now.
    const chargingProfile = await templateService.get('cps.chargeProfile.company');

    const res = await capabilitiesManagement.enableVoiceCapability({
      carrierId,
      sipRoutingProfileId,
      enableOnnetCharging,
      enableOffnetCharging,
      chargingProfile,
    });
    const { id: voiceProfileId } = res.body;
    if (!voiceProfileId) {
      throw new ReferenceError('Unexpected response from CPS sms activation: id missing');
    }
    return {
      results: {
        voiceProfileId,
      },
    };
  }

  activateVoice.$meta = {
    name: VOICE_CAPABILITY_ACTIVATION,
  };

  return activateVoice;
}

export default createVoiceCapabilityActivationTask;
