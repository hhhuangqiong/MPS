import { check } from 'm800-util';
import { Capability, CapabilityType } from './../../domain';

import { createSmsProfileCapabilityActivationTask } from './createSmsProfileCapabilityActivationTask';
import { IM_TO_SMS_CAPABILITY_ACTIVATION } from './bpmnEvents';


export function createImToSmsCapabilityActivationTask(capabilitiesManagement, templateService) {
  check.ok('capabilitiesManagement', capabilitiesManagement);
  check.ok('templateService', templateService);

  const activateImToSms = createSmsProfileCapabilityActivationTask(templateService, capabilitiesManagement, {
    internal: Capability.IM_TO_SMS,
    external: CapabilityType.IM_TO_SMS,
    requirements: [Capability.IM_TO_SMS],
    templateKey: 'cps.im-to-sms',
  });

  activateImToSms.$meta = {
    name: IM_TO_SMS_CAPABILITY_ACTIVATION,
  };

  return activateImToSms;
}

export default createImToSmsCapabilityActivationTask;
