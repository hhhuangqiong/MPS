import _ from 'lodash';
import { ArgumentNullError } from 'common-errors';

import ioc from '../../../ioc';
import { createTask } from '../../util/task';

const CapabilitiesManagement = ioc.container.CapabilitiesManagement;

export default function activationByType({ name: taskName, profileCapability, requestCapabilityType }) {
  function rerunValidation(profile, taskResult) {
    const { done } = taskResult;

    if (done) {
      // skip if completed
      return false;
    }

    return true;
  }

  function needActivation(capabilities) {
    return _.intersection(capabilities, profileCapability).length > 0;
  }

  function run(profile, cb) {
    const { carrierId, capabilities } = profile;

    if (!carrierId) {
      cb(new ArgumentNullError('carrierId'));
      return;
    }

    if (!needActivation(capabilities)) {
      cb(null, { done: false });
      return;
    }

    CapabilitiesManagement.enableCapabilityByType(requestCapabilityType, { carrierId }).then(() => {
      cb(null, { done: true });
    })
    .catch(cb);
  }

  return createTask(taskName, run, { rerunValidation });
}
