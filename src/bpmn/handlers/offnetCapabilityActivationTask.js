import { check, createCapabilityActivationByTypeTask } from './util';
import { Capability, CapabilityType } from './../../domain';

export function createOffnetCapabilityActivationTask(logger, capabilitiesManagement) {
  check.ok('logger', logger);
  check.ok('capabilitiesManagement', capabilitiesManagement);

  const options = {
    name: 'OFFNET_CAPABILITY_ACTIVATION',
    profileCapability: [Capability.CALL_OFFNET],
    requestCapabilityType: CapabilityType.OFFNET,
  };
  return createCapabilityActivationByTypeTask(logger, capabilitiesManagement, options);
}

export default createOffnetCapabilityActivationTask;
