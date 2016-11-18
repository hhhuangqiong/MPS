import { check } from './../../util';
import { Capability, CapabilityType } from './../../domain';
import { IM_CAPABILITY_ACTIVATION } from './bpmnEvents';
import { createCapabilityActivationTask } from './createCapabilityActivationTask';

export function createImCapabilityActivationTask(capabilitiesManagement) {
  check.ok('capabilitiesManagement', capabilitiesManagement);

  const activateIm = createCapabilityActivationTask(capabilitiesManagement, {
    requirements: [Capability.IM],
    internal: Capability.IM,
    external: CapabilityType.IM,
  });

  activateIm.$meta = {
    name: IM_CAPABILITY_ACTIVATION,
  };

  return activateIm;
}

export default createImCapabilityActivationTask;
