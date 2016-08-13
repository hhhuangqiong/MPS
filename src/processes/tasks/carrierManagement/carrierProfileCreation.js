import { ArgumentNullError, ReferenceError } from 'common-errors';

import ioc from '../../../ioc';
import { createTask } from '../../util';

const CarrierManagement = ioc.container.CarrierManagement;

function validateRerun(profile, taskResult) {
  if (taskResult.carrierProfileId) {
    // skip on rerun
    return false;
  }

  return true;
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

  CarrierManagement.createCarrierProfile(params)
    .then(response => {
      const { id: carrierProfileId } = response.body;

      if (!carrierProfileId) {
        throw new ReferenceError('id not defined in response from carrier profile creation');
      }

      cb(null, { carrierProfileId });
    })
    .catch(cb);
}

export default createTask('CARRIER_PROFILE_CREATION', run, { validateRerun });
