import { ArgumentNullError, ReferenceError } from 'common-errors';

import ioc from '../../../ioc';
import { createTask } from '../../util/task';

const CapabilitiesManagement = ioc.container.CapabilitiesManagement;

function validateRerun(profile, taskResult) {
  if (taskResult.developerId) {
    // already enabled, skip
    return false;
  }

  return true;
}

function run(profile, cb) {
  const { carrierId } = profile;

  if (!carrierId) {
    cb(new ArgumentNullError('profile.carrierId'));
    return;
  }

  CapabilitiesManagement.enableApiCapability({ carrierId }).then(res => {
    const { id: developerId } = res.body;

    if (!developerId) {
      throw new ReferenceError('Unexpected response from CPS api developer: id missing');
    }

    cb(null, { developerId });
  })
  .catch(cb);
}

export default createTask('API_CAPABILITY_ACTIVATION', run, { validateRerun });
