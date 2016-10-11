import _ from 'lodash';

export const ProcessStatus = {
  CREATED: 'CREATED',
  COMPLETE: 'COMPLETE',
  IN_PROGRESS: 'IN_PROGRESS',
  ERROR: 'ERROR',
  UPDATING: 'UPDATING',
};

export const ProcessStatuses = _.values(ProcessStatus);

export const ServiceType = {
  SDK: 'SDK',
  WHITE_LABEL: 'WHITE_LABEL',
  LIVE_CONNECT: 'LIVE_CONNECT',
};
export const ServiceTypes = _.values(ServiceType);

// TODO: Why do we ever have this mapping? Just use existing enums from backend, please...
export const BossServiceType = {
  [ServiceType.SDK]: 'sdk',
  [ServiceType.WHITE_LABEL]: 'wl',
  [ServiceType.LIVE_CONNECT]: 'lc',
};
export const BossServiceTypes = _.values(BossServiceType);

export const Capability = {
  IM: 'im',
  IM_TO_SMS: 'im.im-to-sms',
  CALL_ONNET: 'call.onnet',
  CALL_OFFNET: 'call.offnet',
  CALL_MAAII_IN: 'call.maaii-in',
  PUSH: 'push',
  VERIFICATION_MO: 'verification.mo',
  VERIFICATION_MT: 'verification.mt',
  VERIFICATION_SMS: 'verification.sms',
  VERIFICATION_IVR: 'verification.ivr',
  VSF: 'vsf',
  PLATFORM_ANDROID: 'platform.android',
  PLATFORM_IOS: 'platform.ios',
  PLATFORM_WEB: 'platform.web',
  END_USER_WHITELIST: 'end-user.whitelist',
  END_USER_SUSPENSION: 'end-user.suspension',
};
export const Capabilities = _.values(Capability);

export const ChargeWallet = {
  WALLET_NONE: 'WALLET_NONE',
  WALLET_END_USER: 'WALLET_END_USER',
  WALLET_COMPANY: 'WALLET_COMPANY',
  WALLET_OCS_INTEGRATION: 'WALLET_OCS_INTEGRATION',
};
export const ChargeWallets = _.values(ChargeWallet);

export const PaymentMode = {
  PRE_PAID: 'PRE_PAID',
  POST_PAID: 'POST_PAID',
};
export const PaymentModes = _.values(PaymentMode);

export const BossPaymentMode = {
  [PaymentMode.PRE_PAID]: 'prepaid',
  [PaymentMode.POST_PAID]: 'postpaid',
};
export const BossPaymentModes = _.values(BossPaymentMode);

export const CapabilityType = {
  API: 'API',
  IM: 'IM',
  OFFNET: 'Offnet',
  ONNET: 'Onnet',
  PUSH: 'Push',
  IM_TO_SMS: 'ImToSms',
  SMS: 'SMS',
  TOP_UP: 'Topup',
  VOICE: 'Voice',
};

export const CapabilityTypes = _.values(CapabilityType);

export const CpsCapabilityType = {
  API: 'com.maaii.carrier.capability.api',
  IM: 'com.maaii.carrier.capability.im',
  OffNet: 'com.maaii.carrier.capability.offnet',
  OnNet: 'com.maaii.carrier.capability.onnet',
  Push: 'com.maaii.carrier.capability.push',
  ImToSms: 'com.maaii.carrier.capability.sms',
  SMS: 'com.maaii.carrier.capability.sms',
  TopUp: 'com.maaii.carrier.capability.topup',
  Voice: 'com.maaii.carrier.capability.voice',
};

export const CpsCapabilityTypes = _.values(CpsCapabilityType);

export const VerificationMethod = {
  SMS: 'SMS',
  IVR: 'IVR',
  MO: 'MobileOriginated',
  MT: 'MobileTerminated',
};

export const VerificationMethods = _.values(VerificationMethod);


export default {
  ProcessStatus,
  ProcessStatuses,
  ServiceType,
  ServiceTypes,
  Capability,
  ChargeWallet,
  PaymentMode,
  PaymentModes,
  BossServiceType,
  BossServiceTypes,
  BossPaymentMode,
  BossPaymentModes,
  CapabilityType,
  CapabilityTypes,
  CpsCapabilityType,
  CpsCapabilityTypes,
  VerificationMethod,
  VerificationMethods,
};
