import { ArgumentNullError, ReferenceError } from 'common-errors';

import { check, createTask } from './util';

export function createCarrierProfileCreationTask(logger, carrierManagement) {
  check.ok('logger', logger);
  check.ok('carrierManagement', carrierManagement);

  function validateRerun(profile, taskResult) {
    return !taskResult.carrierProfileId;
  }

  function run(profile, cb) {
    const { carrierId } = profile;
    if (!carrierId) {
      cb(new ArgumentNullError('carrierId'));
    }
    const params = {
      carrierId,
      attributes: {
        'com|maaii|management|validation|sms|code|length': '3',
        'com|maaii|im|group|participant|max': '20',
        'com|maaii|service|voip|route': 'mss',
      },
    };

    carrierManagement.createCarrierProfile(params)
      .then(response => {
        const { id: carrierProfileId } = response.body;

        if (!carrierProfileId) {
          throw new ReferenceError('id not defined in response from carrier profile creation');
        }

        cb(null, { carrierProfileId });
      })
      .catch(cb);
  }

  return createTask('CARRIER_PROFILE_CREATION', run, { validateRerun }, logger);
}

export default createCarrierProfileCreationTask;
