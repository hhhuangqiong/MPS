import { check, createCapabilityActivationByTypeTask } from './util';
import { Capability, CapabilityType } from './../../domain';

export function createPushCapabilityActivationTask(logger, capabilitiesManagement) {
  check.ok('logger', logger);
  check.ok('capabilitiesManagement', capabilitiesManagement);

  const options = {
    name: 'PUSH_CAPABILITY_ACTIVATION',
    profileCapability: [Capability.PUSH, Capability.IM, Capability.CALL_ONNET],
    requestCapabilityType: CapabilityType.PUSH,
  };
  return createCapabilityActivationByTypeTask(logger, capabilitiesManagement, options);
}

export default createPushCapabilityActivationTask;
