import { check } from 'm800-util';

import { Capability, CapabilityType } from './../../domain';
import { createCapabilityActivationTask } from './createCapabilityActivationTask';
import { TOPUP_CAPABILITY_ACTIVATION } from './bpmnEvents';

export function createTopUpCapabilityActivationTask(capabilitiesManagement) {
  check.ok('capabilitiesManagement', capabilitiesManagement);

  const activateTopUp = createCapabilityActivationTask(capabilitiesManagement, {
    requirements: [Capability.TOP_UP],
    internal: Capability.TOP_UP,
    external: CapabilityType.TOP_UP,
  });

  activateTopUp.$meta = {
    name: TOPUP_CAPABILITY_ACTIVATION,
  };

  return activateTopUp;
}

export default createTopUpCapabilityActivationTask;
