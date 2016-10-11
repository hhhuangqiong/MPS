import { check, createCapabilityActivationByTypeTask } from './util';
import { Capability, CapabilityType } from './../../domain';

export function createImCapabilityActivationTask(logger, capabilitiesManagement) {
  check.ok('logger', logger);
  check.ok('capabilitiesManagement', capabilitiesManagement);

  const options = {
    name: 'IM_CAPABILITY_ACTIVATION',
    profileCapability: Capability.IM,
    requestCapabilityType: CapabilityType.IM,
  };
  return createCapabilityActivationByTypeTask(logger, capabilitiesManagement, options);
}

export default createImCapabilityActivationTask;
