import { check } from './../../../util';
import { PROVISIONING_END } from '../bpmnEvents';
import { createStore } from './../common';

export function createProvisioningEndHandler(provisioningService) {
  check.ok('provisioningService', provisioningService);

  async function endProvisioning(profile, context) {
    const { logger } = context;
    const store = createStore(this);
    const state = store.get();

    logger.debug('Input profile: ', profile);
    logger.debug('Final process state: ', state);

    const params = {
      ...state.public,
      provisioningId: state.system.provisioningId,
    };
    await provisioningService.completeProvisioning(params);
    return profile;
  }

  endProvisioning.$meta = {
    name: PROVISIONING_END,
  };

  return endProvisioning;
}

export default createProvisioningEndHandler;
