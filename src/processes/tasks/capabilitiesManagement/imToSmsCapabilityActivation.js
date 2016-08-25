import { Capabilities } from '../../../models/Provisioning';
import ioc from '../../../ioc';

import smsProfileCapabilityActivation from './smsProfileCapabilityActivation';

const { cpsConfig, CapabilitiesManagement } = ioc.container;
const { template } = cpsConfig['im-to-sms'];
const { CapabilityTypes } = CapabilitiesManagement.constructor;

export default smsProfileCapabilityActivation({
  taskName: 'IM_TO_SMS_CAPABILITY_ACTIVATION',
  profileCapability: [Capabilities.IM_TO_SMS],
  requestCapabilityType: CapabilityTypes.IM_TO_SMS,
  template,
});
