import { check } from './../../util';
import { Capability, CapabilityType } from './../../domain';

import { createSmsProfileCapabilityActivationTask } from './createSmsProfileCapabilityActivationTask';
import { SMS_CAPABILITY_ACTIVATION } from './bpmnEvents';

export function createSmsCapabilityActivationTask(capabilitiesManagement, templateService) {
  check.ok('capabilitiesManagement', capabilitiesManagement);
  check.ok('templateService', templateService);

  const activateSms = createSmsProfileCapabilityActivationTask(templateService, capabilitiesManagement, {
    internal: Capability.VERIFICATION_SMS,
    external: CapabilityType.SMS,
    requirements: [Capability.VERIFICATION_SMS],
    templateKey: 'cps.sms',
  });

  activateSms.$meta = {
    name: SMS_CAPABILITY_ACTIVATION,
  };

  return activateSms;
}

export default createSmsCapabilityActivationTask;
