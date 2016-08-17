import _ from 'lodash';
import { ReferenceError } from 'common-errors';

import { Capabilities } from '../../../models/Provisioning';
import ioc from '../../../ioc';
import { createTask } from '../../util/task';


const CapabilitiesManagement = ioc.container.CapabilitiesManagement;

function rerunValidation(profile, taskResult) {
  if (taskResult.smsProfileId) {
    // already enabled, skip
    return false;
  }

  return true;
}

// from definition, voice should be enabled on either ONNET/OFFNET/MAAIN_IN is
// enabled in provisioning profile
function needActivation(capabilities) {
  const any = [
    Capabilities.IM_TO_SMS,
  ];
  return _.intersection(capabilities, any).length > 0;
}


function run(profile, cb) {
  const { carrierId, capabilities } = profile;

  if (!needActivation(capabilities)) {
    cb(null, {});
    return;
  }

  CapabilitiesManagement.enableSmsCapability({ carrierId }).then(res => {
    const { id: smsProfileId } = res.body;

    if (!smsProfileId) {
      throw new ReferenceError('Unexpected response from CPS sms activation: id missing');
    }

    cb(null, { smsProfileId });
  })
  .catch(cb);
}

export default createTask('SMS_CAPABILITY_ACTIVATION', run, { rerunValidation });
