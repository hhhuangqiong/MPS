import { check, createCapabilityActivationByTypeTask } from './util';
import { Capability, CapabilityType } from './../../domain';

export function createOnnetCapabilityActivationTask(logger, capabilitiesManagement) {
  check.ok('logger', logger);
  check.ok('capabilitiesManagement', capabilitiesManagement);

  const options = {
    name: 'ONNET_CAPABILITY_ACTIVATION',
    profileCapability: [Capability.CALL_ONNET],
    requestCapabilityType: CapabilityType.ONNET,
  };
  return createCapabilityActivationByTypeTask(logger, capabilitiesManagement, options);
}

export default createOnnetCapabilityActivationTask;
