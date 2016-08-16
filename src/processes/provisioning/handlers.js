// Carrier Profile Management
export CARRIER_CREATION from '../tasks/carrierManagement/carrierCreation';
export USER_CARRIER_PROFILE_CREATION from '../tasks/carrierManagement/userCarrierProfileCreation';
export CARRIER_PROFILE_CREATION from '../tasks/carrierManagement/carrierProfileCreation';

export RECEIVE_PREFIX from '../tasks/receivePrefix';
export TOPUP_CAPABILITY_ACTIVATION from '../tasks/topupCapabilityActiviation';

export PUSH_CAPABILITY_ACTIVATION from '../tasks/pushCapabilityActivation';
export ONNET_CAPABILITY_ACTIVATION from '../tasks/onnetCapabilityActivation';
export OFFNET_CAPABILITY_ACTIVATION from '../tasks/offnetCapabilityActivation';
export IM_CAPABILITY_ACTIVATION from '../tasks/imCapabilityActivation';
export VOICE_CAPABILITY_ACTIVATION from '../tasks/voiceCapabilityActivation';
export SMS_CAPABILITIY_ACTIVATION from '../tasks/smsCapabilitiyActivation';

export GET_NOTIFICATION_TEMPLATE from '../tasks/getNotificationTemplate';
export SAVE_NOTIFICATION from '../tasks/saveNotification';

export SIP_GATEWAY_CREATION from '../tasks/sipGatewayCreation';
export SIP_ROUTING_CREATION from '../tasks/sipRoutingCreation';
export VOICE_SERVICE_PROFILE_CREATION from '../tasks/voiceServiceProfileCreation';

export BOSS_PROVISION from '../tasks/bossProvision';

export API_CAPABILITY_ACTIVATION from '../tasks/apiCapabilityActivation';
export GET_FEATURE_SET_TEMPLATE from '../tasks/getFeatureSetTemplate';
export SET_FEATURE_SET from '../tasks/setFeatureSet';
export SAVE_APPLICATION from '../tasks/saveApplication';
export CERTIFICATION_CREATION from '../tasks/certificationCreation';

export COMPANY_CREATION from '../tasks/companyCreation';

export {
  PARALLEL_ALL_START,
  JOIN_CAPABILITY_AND_FEATURE_SET,
  PARALLEL_ALL_END,
} from './gateways';
