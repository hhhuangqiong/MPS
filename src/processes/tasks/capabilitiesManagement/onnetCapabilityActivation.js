import activationByType from './activationByType';

import { Capabilities } from '../../../models/Provisioning';
import { CapabilityTypes } from '../../../requests/CapabilitiesManagement';

export default activationByType({
  name: 'ONNET_CAPABILITY_ACTIVATION',
  profileCapability: [Capabilities.CALL_ONNET],
  requestCapabilityType: CapabilityTypes.ONNET,
});
