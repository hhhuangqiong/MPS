import { Capabilities } from '../../../models/Provisioning';
import ioc from '../../../ioc';

import smsProfileCapabilityActivation from './smsProfileCapabilityActivation';


const { cpsConfig, CapabilitiesManagement } = ioc.container;
const { template } = cpsConfig.sms;
const { CapabilityTypes } = CapabilitiesManagement.constructor;

export default smsProfileCapabilityActivation({
  taskName: 'SMS_CAPABILITY_ACTIVATION',
  profileCapability: [Capabilities.VERIFICATION_SMS],
  requestCapabilityType: CapabilityTypes.SMS,
  template,
});
