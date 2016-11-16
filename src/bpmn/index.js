import _ from 'lodash';

import {
  bpmnEvents,

  createApiCapabilityActivationTask,
  createBossProvisionTask,
  createCarrierCreationTask,
  createCarrierProfileCreationTask,
  createCertificationCreationTask,
  createCompanyCreationTask,
  createFeatureSetCreationTask,
  createImCapabilityActivationTask,
  createImToSmsCapabilityActivationTask,
  createSignUpRuleProvisionTask,
  createNotificationCreationTask,
  createOnnetCapabilityActivationTask,
  createOffnetCapabilityActivationTask,
  createPushCapabilityActivationTask,
  createSaveApplicationTask,
  createSipRoutingCreationTask,
  createSipGatewayCreationTask,
  createSmsCapabilityActivationTask,
  createTopUpCapabilityActivationTask,
  createUserCarrierProfileCreationTask,
  createVoiceCapabilityActivationTask,
  createVerificationProfileCreationTask,
  createWlpAccessCreationTask,

  gateways,
  createDefaultHandler,
  createDefaultErrorHandler,

  createProvisioningStartHandler,
  createProvisioningEndHandler,
} from './handlers';
import { provisioningProcessManager } from './provisioningProcessManager';

export * from './handlers';
export * from './provisioningProcessManager';

export function register(container) {
  const BPMN_PREFIX = 'bpmn__';
  function registerBpmnHandler(eventName, handler, ...deps) {
    container.service(`${BPMN_PREFIX}${eventName}`, handler, ...deps);
  }

  // BPMN Handlers
  registerBpmnHandler(
    bpmnEvents.PROVISIONING_START,
    createProvisioningStartHandler
  );
  registerBpmnHandler(
    bpmnEvents.PROVISIONING_END,
    createProvisioningEndHandler,
    'ProvisioningService'
  );
  registerBpmnHandler(
    bpmnEvents.DEFAULT_EVENT_HANDLER,
    createDefaultHandler
  );
  registerBpmnHandler(
    bpmnEvents.DEFAULT_ERROR_HANDLER,
    createDefaultErrorHandler
  );
  registerBpmnHandler(
    bpmnEvents.API_CAPABILITY_ACTIVATION,
    createApiCapabilityActivationTask,
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.BOSS_PROVISION,
    createBossProvisionTask,
    'bossOptions',
    'BossProvisionManagement',
    'CapabilitiesManagement',
  );
  registerBpmnHandler(
    bpmnEvents.CARRIER_CREATION,
    createCarrierCreationTask,
    'cpsOptions',
    'CarrierManagement'
  );
  registerBpmnHandler(
    bpmnEvents.CARRIER_PROFILE_CREATION,
    createCarrierProfileCreationTask,
    'CarrierManagement'
  );
  registerBpmnHandler(
    bpmnEvents.CERTIFICATION_CREATION,
    createCertificationCreationTask,
    'CertificateManagement'
  );
  registerBpmnHandler(
    bpmnEvents.COMPANY_CREATION,
    createCompanyCreationTask,
    'CompanyManagement'
  );
  registerBpmnHandler(
    bpmnEvents.FEATURE_SET_CREATION,
    createFeatureSetCreationTask,
    'FeatureSetManagement'
  );
  registerBpmnHandler(
    bpmnEvents.IM_CAPABILITY_ACTIVATION,
    createImCapabilityActivationTask,
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.IM_TO_SMS_CAPABILITY_ACTIVATION,
    createImToSmsCapabilityActivationTask,
    'CapabilitiesManagement',
    'cpsOptions'
  );
  registerBpmnHandler(
    bpmnEvents.SIGNUP_RULE_PROVISION,
    createSignUpRuleProvisionTask,
    'signUpRuleOptions',
    'SignUpRuleMgmt'
  );
  registerBpmnHandler(
    bpmnEvents.NOTIFICATION_CREATION,
    createNotificationCreationTask,
    'NotificationManagement',
    'bpmnConcurrencyOptions',
  );
  registerBpmnHandler(
    bpmnEvents.ONNET_CAPABILITY_ACTIVATION,
    createOnnetCapabilityActivationTask,
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.OFFNET_CAPABILITY_ACTIVATION,
    createOffnetCapabilityActivationTask,
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.PUSH_CAPABILITY_ACTIVATION,
    createPushCapabilityActivationTask,
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.SAVE_APPLICATION,
    createSaveApplicationTask,
    'cpsOptions',
    'ApplicationManagement'
  );
  registerBpmnHandler(
    bpmnEvents.SIP_GATEWAY_CREATION,
    createSipGatewayCreationTask,
    'cpsOptions',
    'VoiceProvisioningManagement'
  );
  registerBpmnHandler(
    bpmnEvents.SIP_ROUTING_CREATION,
    createSipRoutingCreationTask,
    'cpsOptions',
    'VoiceProvisioningManagement',
  );
  registerBpmnHandler(
    bpmnEvents.SMS_CAPABILITY_ACTIVATION,
    createSmsCapabilityActivationTask,
    'CapabilitiesManagement',
    'cpsOptions'
  );
  registerBpmnHandler(
    bpmnEvents.TOPUP_CAPABILITY_ACTIVATION,
    createTopUpCapabilityActivationTask,
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.USER_CARRIER_PROFILE_CREATION,
    createUserCarrierProfileCreationTask,
    'CarrierManagement'
  );
  registerBpmnHandler(
    bpmnEvents.VOICE_CAPABILITY_ACTIVATION,
    createVoiceCapabilityActivationTask,
    'cpsOptions',
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.VERIFICATION_PROFILE_CREATION,
    createVerificationProfileCreationTask,
    'cpsOptions',
    'VerificationManagement',
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.WLP_ACCESS_CREATION,
    createWlpAccessCreationTask,
    'iamOptions',
    'AccessManagement'
  );

  registerBpmnHandler(bpmnEvents.JOIN_CAPABILITY_AND_FEATURE_SET, () => gateways.joinCapabilityAndFeatureSetGateway);
  registerBpmnHandler(bpmnEvents.PARALLEL_ALL_START, () => gateways.parallelAllStartGateway);
  registerBpmnHandler(bpmnEvents.PARALLEL_ALL_END, () => gateways.parallelAllEndGateway);

  container.factory('bpmnHandlers', c => {
    // Grab all handlers starting with bpmn prefix
    const handlers = _(c)
      .keys()
      .filter(key => _.startsWith(key, BPMN_PREFIX))
      .map(key => [key.replace(BPMN_PREFIX, ''), c[key]])
      .fromPairs()
      .value();
    return handlers;
  });

  // BPMN Process Manager
  container.service(
    'ProvisioningProcessManager',
    provisioningProcessManager,
    'logger',
    'mongoOptions',
    'bpmnHandlers',
    'eventBus',
  );
}

export default register;
