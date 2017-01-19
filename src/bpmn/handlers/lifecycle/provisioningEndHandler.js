import { check } from 'm800-util';

import { PROVISIONING_END } from '../bpmnEvents';
import { createStore } from './../common';

export function createProvisioningEndHandler(provisioningService) {
  check.ok('provisioningService', provisioningService);

  async function endProvisioning(profile, context) {
    const { logger } = context;
    const store = createStore(this);
    const state = store.get();

    // stringify and parse profile because it will also print out the _bsontype which is mongoDB internal property
    logger.debug('Input profile: ', JSON.parse(JSON.stringify(profile)));
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
