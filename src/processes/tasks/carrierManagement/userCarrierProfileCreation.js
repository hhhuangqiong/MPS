import { ArgumentNullError, ReferenceError } from 'common-errors';

import ioc from '../../../ioc';
import { createTask } from '../../util/task';

const CarrierManagement = ioc.container.CarrierManagement;

function validateRerun(profile, taskResult) {
  if (taskResult.carrierProfileId) {
    // skip on rerun
    return false;
  }

  return true;
}


function run(data, cb) {
  const { carrierId } = data;

  if (!carrierId) {
    cb(new ArgumentNullError('carrierId'));
  }

  const params = {
    carrierId,
    attributes: {
      'com|maaii|service|voip|ice|disabled': 'true',
      'com|maaii|service|voip|enabled': 'true',
      'com|maaii|user|type|preapaid': 'true',
      'com|maaii|application|credit|upperlimit': '-1',
      'com|maaii|application|earning|Email|amount': '0.3',
      'com|maaii|application|earning|FBpost|amount': '0.3',
      'com|maaii|application|earning|Twitterpost|amount': '0.3',
      'com|maaii|application|earning|WBpost|amount': '0.3',
      'com|maaii|application|earning|enabled': 'false',
      'com|maaii|application|earning|random|enabled': 'true',
      'com|maaii|application|earning|rateus|amount': '0.3',
      'com|maaii|application|earning|smsinvite|amount': '1',
      'com|maaii|service|voip|packetlossthreshold': '7',
    },
  };

  CarrierManagement.createUserCarrierProfile(params)
    .then(response => {
      const { id: userCarrierProfileId } = response.body;
      if (!userCarrierProfileId) {
        throw new ReferenceError('userCarrierProfileId is not defined in response body');
      }

      cb(null, { userCarrierProfileId });
    })
    .catch(cb);
}

export default createTask('USER_CARRIER_PROFILE_CREATION', run, { validateRerun });
