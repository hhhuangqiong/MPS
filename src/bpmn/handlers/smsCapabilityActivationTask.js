import { check } from './../../util';
import { Capability, CapabilityType } from './../../domain';

import { createSmsProfileCapabilityActivationTask } from './createSmsProfileCapabilityActivationTask';
import { SMS_CAPABILITY_ACTIVATION } from './bpmnEvents';

export function createSmsCapabilityActivationTask(capabilitiesManagement, cpsOptions) {
  check.ok('capabilitiesManagement', capabilitiesManagement);
  check.ok('cpsOptions', cpsOptions);

  const { template } = cpsOptions.sms;

  const activateSms = createSmsProfileCapabilityActivationTask(cpsOptions, capabilitiesManagement, {
    requirements: [Capability.VERIFICATION_SMS],
    internal: Capability.VERIFICATION_SMS,
    external: CapabilityType.SMS,
    template,
  });

  activateSms.$meta = {
    name: SMS_CAPABILITY_ACTIVATION,
  };

  return activateSms;
}

export default createSmsCapabilityActivationTask;
