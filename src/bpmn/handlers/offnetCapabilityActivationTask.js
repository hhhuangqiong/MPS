import { check } from './../../util';
import { Capability, CapabilityType } from './../../domain';
import { createCapabilityActivationTask } from './createCapabilityActivationTask';
import { OFFNET_CAPABILITY_ACTIVATION } from './bpmnEvents';

export function createOffnetCapabilityActivationTask(capabilitiesManagement) {
  check.ok('capabilitiesManagement', capabilitiesManagement);

  const activateOffnet = createCapabilityActivationTask(capabilitiesManagement, {
    requirements: [Capability.CALL_OFFNET],
    internal: Capability.CALL_OFFNET,
    external: CapabilityType.OFFNET,
  });

  activateOffnet.$meta = {
    name: OFFNET_CAPABILITY_ACTIVATION,
  };

  return activateOffnet;
}

export default createOffnetCapabilityActivationTask;
