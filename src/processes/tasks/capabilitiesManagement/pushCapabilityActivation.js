import activationByType from './activationByType';

import { Capabilities } from '../../../models/Provisioning';
import { CapabilityTypes } from '../../../requests/CapabilitiesManagement';

export default activationByType({
  name: 'PUSH_CAPABILITY_ACTIVATION',
  profileCapability: [Capabilities.PUSH, Capabilities.IM, Capabilities.CALL_ONNET],
  requestCapabilityType: CapabilityTypes.PUSH,
});
