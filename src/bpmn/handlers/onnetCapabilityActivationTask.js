import { check } from 'm800-util';

import { Capability, CapabilityType } from './../../domain';
import { createCapabilityActivationTask } from './createCapabilityActivationTask';
import { ONNET_CAPABILITY_ACTIVATION } from './bpmnEvents';

export function createOnnetCapabilityActivationTask(capabilitiesManagement) {
  check.ok('capabilitiesManagement', capabilitiesManagement);

  const activateOnnet = createCapabilityActivationTask(capabilitiesManagement, {
    requirements: [Capability.CALL_ONNET],
    internal: Capability.CALL_ONNET,
    external: CapabilityType.ONNET,
  });

  activateOnnet.$meta = {
    name: ONNET_CAPABILITY_ACTIVATION,
  };

  return activateOnnet;
}

export default createOnnetCapabilityActivationTask;
