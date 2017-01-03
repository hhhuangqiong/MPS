import { ArgumentNullError, ReferenceError } from 'common-errors';
import { check } from 'm800-util';

import { USER_CARRIER_PROFILE_CREATION } from './bpmnEvents';

export function createUserCarrierProfileCreationTask(carrierManagement) {
  check.ok('carrierManagement', carrierManagement);

  async function createUserCarrierProfile(state) {
    if (state.results.userCarrierProfileId) {
      return null;
    }
    const { carrierId } = state.results;
    if (!carrierId) {
      throw new ArgumentNullError('carrierId');
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

    const response = await carrierManagement.createUserCarrierProfile(params);
    const { id: userCarrierProfileId } = response.body;
    if (!userCarrierProfileId) {
      throw new ReferenceError('userCarrierProfileId is not defined in response body');
    }
    return {
      results: {
        userCarrierProfileId,
      },
    };
  }

  createUserCarrierProfile.$meta = {
    name: USER_CARRIER_PROFILE_CREATION,
  };

  return createUserCarrierProfile;
}

export default createUserCarrierProfileCreationTask;
