import { ArgumentNullError, ReferenceError } from 'common-errors';
import { check } from 'm800-util';

import { CARRIER_PROFILE_CREATION } from './bpmnEvents';

export function createCarrierProfileCreationTask(carrierManagement) {
  check.ok('carrierManagement', carrierManagement);

  async function createCarrierProfile(state) {
    if (state.results.carrierProfileId) {
      return null;
    }
    const { carrierId } = state.results;
    if (!carrierId) {
      throw new ArgumentNullError('carrierId');
    }
    const params = {
      carrierId,
      attributes: {
        'com|maaii|management|validation|sms|code|length': '3',
        'com|maaii|im|group|participant|max': '20',
        'com|maaii|service|voip|route': 'mss',
      },
    };
    const response = await carrierManagement.createCarrierProfile(params);
    const { id: carrierProfileId } = response.body;
    if (!carrierProfileId) {
      throw new ReferenceError('id not defined in response from carrier profile creation');
    }
    return {
      results: {
        carrierProfileId,
      },
    };
  }

  createCarrierProfile.$meta = {
    name: CARRIER_PROFILE_CREATION,
  };

  return createCarrierProfile;
}

export default createCarrierProfileCreationTask;
