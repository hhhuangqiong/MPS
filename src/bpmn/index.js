import _ from 'lodash';

import {
  createApiCapabilityActivationTask,
  createBossProvisionTask,
  createCarrierCreationTask,
  createCarrierProfileCreationTask,
  createCertificationCreationTask,
  createCompanyCreationTask,
  createFeatureSetCreationTask,
  createImCapabilityActivationTask,
  createImToSmsCapabilityActivationTask,
  createMumsSignUpRuleProvisionTask,
  createNotificationCreationTask,
  createOnnetCapabilityActivationTask,
  createOffnetCapabilityActivationTask,
  createPushCapabilityActivationTask,
  createSaveApplicationTask,
  createSipRoutingCreationTask,
  createSipGatewayCreationTask,
  createSmsCapabilityActivationTask,
  createTopupCapabilityActivationTask,
  createUserCarrierProfileCreationTask,
  createVoiceCapabilityActivationTask,
  createVerificationProfileCreationTask,
  createWlpAccessCreationTask,

  gateways,
  createTaskStartHandler,
  createTaskEndHandler,
  createDefaultHandler,
  createDefaultErrorHandler,

  createProvisioningStartTask,
  createProvisioningEndTask,
} from './handlers';
import * as bpmnEvents from './bpmnEvents';
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
    createProvisioningStartTask,
    'logger'
  );
  registerBpmnHandler(
    bpmnEvents.PROVISIONING_END,
    createProvisioningEndTask,
    'logger',
    'ProvisioningService'
  );
  registerBpmnHandler(
    bpmnEvents.ON_END_HANDLER,
    createTaskEndHandler,
    'logger'
  );
  registerBpmnHandler(
    bpmnEvents.ON_BEGIN_HANDLER,
    createTaskStartHandler,
    'logger'
  );
  registerBpmnHandler(
    bpmnEvents.DEFAULT_EVENT_HANDLER,
    createDefaultHandler,
    'logger',
  );
  registerBpmnHandler(
    bpmnEvents.DEFAULT_ERROR_HANDLER,
    createDefaultErrorHandler,
    'logger'
  );
  registerBpmnHandler(
    bpmnEvents.API_CAPABILITY_ACTIVATION,
    createApiCapabilityActivationTask,
    'logger',
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.BOSS_PROVISION,
    createBossProvisionTask,
    'logger',
    'bossOptions',
    'BossProvisionManagement',
    'CapabilitiesManagement',
  );
  registerBpmnHandler(
    bpmnEvents.CARRIER_CREATION,
    createCarrierCreationTask,
    'logger',
    'cpsOptions',
    'CarrierManagement'
  );
  registerBpmnHandler(
    bpmnEvents.CARRIER_PROFILE_CREATION,
    createCarrierProfileCreationTask,
    'logger',
    'CarrierManagement'
  );
  registerBpmnHandler(
    bpmnEvents.CERTIFICATION_CREATION,
    createCertificationCreationTask,
    'logger',
    'CertificateManagement'
  );
  registerBpmnHandler(
    bpmnEvents.COMPANY_CREATION,
    createCompanyCreationTask,
    'logger',
    'CompanyManagement'
  );
  registerBpmnHandler(
    bpmnEvents.FEATURE_SET_CREATION,
    createFeatureSetCreationTask,
    'logger',
    'FeatureSetManagement'
  );
  registerBpmnHandler(
    bpmnEvents.IM_CAPABILITY_ACTIVATION,
    createImCapabilityActivationTask,
    'logger',
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.IM_TO_SMS_CAPABILITY_ACTIVATION,
    createImToSmsCapabilityActivationTask,
    'logger',
    'CapabilitiesManagement',
    'cpsOptions'
  );
  registerBpmnHandler(
    bpmnEvents.MUMS_SIGNUP_RULE_PROVISION,
    createMumsSignUpRuleProvisionTask,
    'logger',
    'mumsOptions',
    'MumsSignUpRuleMgmt'
  );
  registerBpmnHandler(
    bpmnEvents.NOTIFICATION_CREATION,
    createNotificationCreationTask,
    'logger',
    'NotificationManagement'
  );
  registerBpmnHandler(
    bpmnEvents.ONNET_CAPABILITY_ACTIVATION,
    createOnnetCapabilityActivationTask,
    'logger',
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.OFFNET_CAPABILITY_ACTIVATION,
    createOffnetCapabilityActivationTask,
    'logger',
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.PUSH_CAPABILITY_ACTIVATION,
    createPushCapabilityActivationTask,
    'logger',
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.SAVE_APPLICATION,
    createSaveApplicationTask,
    'logger',
    'cpsOptions',
    'ApplicationManagement'
  );
  registerBpmnHandler(
    bpmnEvents.SIP_GATEWAY_CREATION,
    createSipGatewayCreationTask,
    'logger',
    'cpsOptions',
    'VoiceProvisioningManagement'
  );
  registerBpmnHandler(
    bpmnEvents.SIP_ROUTING_CREATION,
    createSipRoutingCreationTask,
    'logger',
    'cpsOptions',
    'VoiceProvisioningManagement',
  );
  registerBpmnHandler(
    bpmnEvents.SMS_CAPABILITY_ACTIVATION,
    createSmsCapabilityActivationTask,
    'logger',
    'CapabilitiesManagement',
    'cpsOptions'
  );
  registerBpmnHandler(
    bpmnEvents.TOPUP_CAPABILITY_ACTIVATION,
    createTopupCapabilityActivationTask,
    'logger',
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.USER_CARRIER_PROFILE_CREATION,
    createUserCarrierProfileCreationTask,
    'logger',
    'CarrierManagement'
  );
  registerBpmnHandler(
    bpmnEvents.VOICE_CAPABILITY_ACTIVATION,
    createVoiceCapabilityActivationTask,
    'logger',
    'cpsOptions',
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.VERIFICATION_PROFILE_CREATION,
    createVerificationProfileCreationTask,
    'logger',
    'cpsOptions',
    'VerificationManagement',
    'CapabilitiesManagement'
  );
  registerBpmnHandler(
    bpmnEvents.WLP_ACCESS_CREATION,
    createWlpAccessCreationTask,
    'logger',
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
