import { check, createCapabilityActivationByTypeTask } from './util';
import { Capability, CapabilityType } from './../../domain';

export function createTopupCapabilityActivationTask(logger, capabilitiesManagement) {
  check.ok('logger', logger);
  check.ok('capabilitiesManagement', capabilitiesManagement);

  const options = {
    name: 'TOPUP_CAPABILITY_ACTIVATION',
    profileCapability: Capability.TOP_UP,
    requestCapabilityType: CapabilityType.TOP_UP,
  };
  return createCapabilityActivationByTypeTask(logger, capabilitiesManagement, options);
}

export default createTopupCapabilityActivationTask;
