import { ReferenceError } from 'common-errors';

import { check } from './../../util';
import * as bpmnEvents from './bpmnEvents';

export function createApiCapabilityActivationTask(capabilitiesManagement) {
  check.ok('capabilitiesManagement', capabilitiesManagement);

  async function activateApiCapability(state) {
    const { carrierId } = state.results;
    check.ok('state.results.carrierId', carrierId);

    let developerId = state.results.developerId;
    if (developerId) {
      return null;
    }
    const res = await capabilitiesManagement.enableApiCapability({ carrierId });
    developerId = res.body.id;
    if (!developerId) {
      throw new ReferenceError('Unexpected response from CPS api developer: id missing');
    }

    return {
      results: {
        developerId,
      },
    };
  }
  activateApiCapability.$meta = {
    name: bpmnEvents.API_CAPABILITY_ACTIVATION,
  };

  return activateApiCapability;
}

export default createApiCapabilityActivationTask;
