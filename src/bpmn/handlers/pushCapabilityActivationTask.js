import { check } from './../../util';
import { Capability, CapabilityType } from './../../domain';
import { createCapabilityActivationTask } from './createCapabilityActivationTask';
import { PUSH_CAPABILITY_ACTIVATION } from './bpmnEvents';

export function createPushCapabilityActivationTask(capabilitiesManagement) {
  check.ok('capabilitiesManagement', capabilitiesManagement);

  const activatePush = createCapabilityActivationTask(capabilitiesManagement, {
    internal: [Capability.PUSH, Capability.IM, Capability.CALL_ONNET],
    external: CapabilityType.PUSH,
  });

  activatePush.$meta = {
    name: PUSH_CAPABILITY_ACTIVATION,
  };

  return activatePush;
}

export default createPushCapabilityActivationTask;
