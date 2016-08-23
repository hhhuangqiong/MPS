import _ from 'lodash';
import { ReferenceError } from 'common-errors';

import { Capabilities } from '../../../models/Provisioning';
import ioc from '../../../ioc';
import { createTask } from '../../util/task';

const { cpsConfig, CapabilitiesManagement } = ioc.container;

function rerunValidation(profile, taskResult) {
  if (taskResult.imToSmsProfileId) {
    // already enabled, skip
    return false;
  }

  return true;
}

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

  // should be specified in form for Phase 2. defaults to company level now.
  const chargingProfile = cpsConfig.chargeProfile.company;
  CapabilitiesManagement.enableImToSmsCapability({ carrierId, chargingProfile }).then(res => {
    const { id: imToSmsProfileId } = res.body;

    if (!imToSmsProfileId) {
      throw new ReferenceError('Unexpected response from CPS im-to-sms activation: id missing');
    }

    cb(null, { imToSmsProfileId });
  })
  .catch(cb);
}

export default createTask('IM_TO_SMS_CAPABILITY_ACTIVATION', run, { rerunValidation });
