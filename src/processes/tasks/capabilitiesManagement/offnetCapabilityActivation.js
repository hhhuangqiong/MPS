import activationByType from './activationByType';

import { Capabilities } from '../../../models/Provisioning';
import { CapabilityTypes } from '../../../requests/CapabilitiesManagement';

export default activationByType({
  name: 'OFFNET_CAPABILITY_ACTIVATION',
  profileCapability: [Capabilities.CALL_OFFNET],
  requestCapabilityType: CapabilityTypes.OFFNET,
});
