import { check, createSmsProfileCapabilityActivationTask } from './util';
import { Capability, CapabilityType } from './../../domain';

export function createSmsCapabilityActivationTask(logger, capabilitiesManagement, cpsOptions) {
  check.ok('logger', logger);
  check.ok('capabilitiesManagement', capabilitiesManagement);
  check.ok('cpsOptions', cpsOptions);

  const { template } = cpsOptions.sms;

  const options = {
    taskName: 'SMS_CAPABILITY_ACTIVATION',
    profileCapability: [Capability.VERIFICATION_SMS],
    requestCapabilityType: CapabilityType.SMS,
    template,
  };
  return createSmsProfileCapabilityActivationTask(logger, cpsOptions, capabilitiesManagement, options);
}

export default createSmsCapabilityActivationTask;
