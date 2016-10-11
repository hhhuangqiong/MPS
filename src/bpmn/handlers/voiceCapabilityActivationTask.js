import _ from 'lodash';
import { ReferenceError, ArgumentNullError } from 'common-errors';

import { check, createTask } from './util';
import { Capability } from './../../domain';

export function createVoiceCapabilityActivationTask(logger, cpsOptions, capabilitiesManagement) {
  check.ok('logger', logger);
  check.ok('cpsOptions', cpsOptions);
  check.ok('capabilitiesManagement', capabilitiesManagement);

  function validateRerun(data, taskResult) {
    return !taskResult.voiceProfileId;
  }

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

  function run(data, cb) {
    const { carrierId, capabilities, sipRoutingProfileId } = data;

    if (!sipRoutingProfileId) {
      cb(new ArgumentNullError('sipRoutingProfileId'));
      return;
    }

    if (!needActivation(capabilities)) {
      cb(null, { done: false });
      return;
    }

    const enableOnnetCharging = _.includes(capabilities, Capability.CALL_ONNET);
    const enableOffnetCharging = _.includes(capabilities, Capability.CALL_OFFNET);

    // should be specified in form for Phase 2. defaults to company level now.
    const chargingProfile = cpsOptions.chargeProfile.company;
    capabilitiesManagement.enableVoiceCapability({
      carrierId,
      sipRoutingProfileId,
      enableOnnetCharging,
      enableOffnetCharging,
      chargingProfile,
    }).then(res => {
      const { id: voiceProfileId } = res.body;

      if (!voiceProfileId) {
        throw new ReferenceError('Unexpected response from CPS sms activation: id missing');
      }

      cb(null, { voiceProfileId });
    })
      .catch(cb);
  }

  return createTask('VOICE_CAPABILITY_ACTIVATION', run, { validateRerun }, logger);
}

export default createVoiceCapabilityActivationTask;
