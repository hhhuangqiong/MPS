import _ from 'lodash';
import { ArgumentNullError } from 'common-errors';

import { check, createTask } from './';

export function createCapabilityActivationByTypeTask(
  logger,
  capabilitiesManagement,
  { name: taskName, profileCapability, requestCapabilityType }
  ) {
  check.ok('logger', logger);
  check.ok('capabilitiesManagement', capabilitiesManagement);
  check.predicate('options', taskName, _.isString, 'Task name should be a string');

  function validateRerun(profile, taskResult) {
    const { done } = taskResult;

    if (done) {
      // skip if completed
      return false;
    }

    return true;
  }

  function needActivation(capabilities) {
    if (!_.isArray(profileCapability)) {
      profileCapability = [profileCapability];
    }

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

    capabilitiesManagement.enableCapabilityByType(requestCapabilityType, { carrierId }).then(() => {
      cb(null, { done: true });
    })
      .catch(cb);
  }

  return createTask(taskName, run, { validateRerun }, logger);
}

export default createCapabilityActivationByTypeTask;
