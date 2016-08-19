// Carrier Profile Management
export CARRIER_CREATION from '../tasks/carrierManagement/carrierCreation';
export USER_CARRIER_PROFILE_CREATION from '../tasks/carrierManagement/userCarrierProfileCreation';
export CARRIER_PROFILE_CREATION from '../tasks/carrierManagement/carrierProfileCreation';

export SIP_GATEWAY_CREATION from '../tasks/sipGatewayCreation';
export SIP_ROUTING_CREATION from '../tasks/sipRoutingCreation';

export TOPUP_CAPABILITY_ACTIVATION from '../tasks/capabilitiesManagement/topupCapabilityActiviation';
export PUSH_CAPABILITY_ACTIVATION from '../tasks/capabilitiesManagement/pushCapabilityActivation';
export ONNET_CAPABILITY_ACTIVATION from '../tasks/capabilitiesManagement/onnetCapabilityActivation';
export OFFNET_CAPABILITY_ACTIVATION from '../tasks/capabilitiesManagement/offnetCapabilityActivation';
export IM_CAPABILITY_ACTIVATION from '../tasks/capabilitiesManagement/imCapabilityActivation';
export VOICE_CAPABILITY_ACTIVATION from '../tasks/capabilitiesManagement/voiceCapabilityActivation';
export SMS_CAPABILITIY_ACTIVATION from '../tasks/capabilitiesManagement/smsCapabilitiyActivation';
export API_CAPABILITY_ACTIVATION from '../tasks/capabilitiesManagement/apiCapabilityActivation';
export IM_TO_SMS_CAPABILITY_ACTIVATION from '../tasks/capabilitiesManagement/imToSmsCapabilityActivation';

export SAVE_NOTIFICATION from '../tasks/saveNotification';

export RECEIVE_PREFIX from '../tasks/receivePrefix';
export BOSS_PROVISION from '../tasks/bossProvision';

export FEATURE_SET_CREATION from '../tasks/featureSetCreation';
export SAVE_APPLICATION from '../tasks/saveApplication';
export CERTIFICATION_CREATION from '../tasks/certificationCreation';

export COMPANY_CREATION from '../tasks/companyCreation';

export {
  PARALLEL_ALL_START,
  JOIN_CAPABILITY_AND_FEATURE_SET,
  PARALLEL_ALL_END,
} from './gateways';
