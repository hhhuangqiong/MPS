import activationByType from './activationByType';

import { Capabilities } from '../../../models/Provisioning';
import { CapabilityTypes } from '../../../requests/CapabilitiesManagement';

export default activationByType({
  name: 'TOPUP_CAPABILITY_ACTIVATION',
  profileCapability: Capabilities.TOP_UP,
  requestCapabilityType: CapabilityTypes.TOP_UP,
});
