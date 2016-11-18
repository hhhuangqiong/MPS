import { check } from './../../util';
import { Capability, CapabilityType } from './../../domain';

import { createSmsProfileCapabilityActivationTask } from './createSmsProfileCapabilityActivationTask';
import { IM_TO_SMS_CAPABILITY_ACTIVATION } from './bpmnEvents';


export function createImToSmsCapabilityActivationTask(capabilitiesManagement, cpsOptions) {
  check.ok('capabilitiesManagement', capabilitiesManagement);
  check.ok('cpsOptions', cpsOptions);

  const { template } = cpsOptions['im-to-sms'];

  const activateImToSms = createSmsProfileCapabilityActivationTask(cpsOptions, capabilitiesManagement, {
    requirements: [Capability.IM_TO_SMS],
    internal: Capability.IM_TO_SMS,
    external: CapabilityType.IM_TO_SMS,
    template,
  });

  activateImToSms.$meta = {
    name: IM_TO_SMS_CAPABILITY_ACTIVATION,
  };

  return activateImToSms;
}

export default createImToSmsCapabilityActivationTask;
