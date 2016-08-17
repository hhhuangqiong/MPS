import _ from 'lodash';
import { ReferenceError, ArgumentNullError } from 'common-errors';

import { Capabilities } from '../../../models/Provisioning';
import ioc from '../../../ioc';
import { createTask } from '../../util/task';

const CapabilitiesManagement = ioc.container.CapabilitiesManagement;

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

  if (!needActivation(capabilities)) {
    cb(null, {});
    return;
  }

  const enableOnnetCharging = _.includes(capabilities, Capabilities.CALL_ONNET);
  const enableOffnetCharging = _.includes(capabilities, Capabilities.CALL_OFFNET);

  CapabilitiesManagement.enableVoiceCapability({
    carrierId,
    sipRoutingProfileId,
    enableOnnetCharging,
    enableOffnetCharging,
  }).then(res => {
    const { id: voiceProfileId } = res.body;

    if (!voiceProfileId) {
      throw new ReferenceError('Unexpected response from CPS sms activation: id missing');
    }

    cb(null, { voiceProfileId });
  })
  .catch(cb);
}

export default createTask('VOICE_CAPABILITY_ACTIVATION', run, { rerunValidation });
