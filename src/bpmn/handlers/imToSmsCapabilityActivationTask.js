import { check, createSmsProfileCapabilityActivationTask } from './util';
import { Capability, CapabilityType } from './../../domain';

export function createImToSmsCapabilityActivationTask(logger, capabilitiesManagement, cpsOptions) {
  check.ok('logger', logger);
  check.ok('capabilitiesManagement', capabilitiesManagement);
  check.ok('cpsOptions', cpsOptions);

  const { template } = cpsOptions['im-to-sms'];

  const options = {
    taskName: 'IM_CAPABILITY_ACTIVATION',
    profileCapability: Capability.IM,
    requestCapabilityType: CapabilityType.IM,
    template,
  };
  return createSmsProfileCapabilityActivationTask(logger, cpsOptions, capabilitiesManagement, options);
}

export default createImToSmsCapabilityActivationTask;
