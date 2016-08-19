// for each supported platforms
// - create an application with feature set id and developer id
// - get the created application id
//


import _ from 'lodash';
import { ReferenceError, ArgumentNullError } from 'common-errors';

import { Capabilities } from '../../../models/Provisioning';
import ioc from '../../../ioc';
import { createTask } from '../../util/task';

const { cpsConfig, CapabilitiesManagement } = ioc.container;

function rerunValidation(data, taskResult) {
  if (taskResult.smsProfileUd) {
    // already enabled, skip
    return false;
  }

  return true;
}

// from definition, voice should be enabled on either ONNET/OFFNET/MAAIN_IN is
// enabled in provisioning profile
function needActivation(capabilities) {
  const any = [
    Capabilities.CALL_ONNET,
    Capabilities.CALL_OFFNET,
    Capabilities.CALL_MAAII_IN,
  ];
  return _.intersection(capabilities, any).length > 0;
}

function run(data, cb) {
  const { carrierId, capabilities, sipRoutingProfileId } = data;

  if (!sipRoutingProfileId) {
    cb(new ArgumentNullError('sipRoutingProfileId'));
    return;
  }

  const enableOnnetCharging = _.includes(capabilities, Capabilities.CALL_ONNET);
  const enableOffnetCharging = _.includes(capabilities, Capabilities.CALL_OFFNET);

  // should be specified in form for Phase 2. defaults to company level now.
  const chargingProfile = cpsConfig.chargeProfile.company;
  CapabilitiesManagement.enableVoiceCapability({
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

export default createTask('SAVE_APPLICATION', run, { rerunValidation });
