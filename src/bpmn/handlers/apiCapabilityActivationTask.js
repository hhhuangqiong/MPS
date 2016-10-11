import { ArgumentNullError, ReferenceError } from 'common-errors';

import { check, createTask } from './util';

export function createApiCapabilityActivationTask(logger, capabilitiesManagement) {
  check.ok('logger', logger);
  check.ok('capabilitiesManagement', capabilitiesManagement);

  function validateRerun(profile, taskResult) {
    return !taskResult.developerId;
  }

  function run(profile, cb) {
    const { carrierId } = profile;

    if (!carrierId) {
      cb(new ArgumentNullError('profile.carrierId'));
      return;
    }

    capabilitiesManagement.enableApiCapability({ carrierId }).then(res => {
      const { id: developerId } = res.body;

      if (!developerId) {
        throw new ReferenceError('Unexpected response from CPS api developer: id missing');
      }

      cb(null, { developerId });
    })
      .catch(cb);
  }

  return createTask('API_CAPABILITY_ACTIVATION', run, { validateRerun }, logger);
}

export default createApiCapabilityActivationTask;
