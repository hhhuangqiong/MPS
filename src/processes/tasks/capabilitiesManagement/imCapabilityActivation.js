import activationByType from './activationByType';

import { Capabilities } from '../../../models/Provisioning';
import { CapabilityTypes } from '../../../requests/CapabilitiesManagement';

export default activationByType({
  name: 'IM_CAPABILITY_ACTIVATION',
  profileCapability: Capabilities.IM,
  requestCapabilityType: CapabilityTypes.IM,
});
