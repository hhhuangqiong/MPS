import {
  CarrierManagement,
  CapabilitiesManagement,
  FeatureSetManagement,
  ApplicationManagement,
  VoiceProvisioningManagement,
  VerificationManagement,
  CertificateManagement,
  NotificationManagement,
  CompanyManagement,
  AccessManagement,
  BossProvisionManagement,
  SignUpRuleMgmt,
  SmsRealmManagement,
  SmsServicePlanManagement,
  MaaiiRateManagement,
} from './external';
import presetService from './presetService';
import provisioningService from './provisioningService';
import templateService from './templateService';
import billingPlanService from './billingPlanService';
import {
  memoryKeyValueStorage,
  mongoKeyValueStorage,
  compositeKeyValueStorage,
} from './storage';
import templates from './templates.json';
import {
  createProvisioningModel,
  createPresetModel,
  createBillingPlanModel,
  createOffNetCallRateTableModel,
  createSmsRateTableModel,
  createExchangeRateTableModel,
  createRateTableModel,
} from './models';

export * from './models';
export * from './storage';
export * from './util';
export * from './presetService';
export * from './provisioningService';
export * from './billingPlanService';

export function register(container) {
  // CPS services
  container.service('CarrierManagement', CarrierManagement, 'logger', 'cpsClientOptions');
  container.service('CapabilitiesManagement', CapabilitiesManagement, 'logger', 'cpsClientOptions');
  container.service('FeatureSetManagement', FeatureSetManagement, 'logger', 'cpsClientOptions');
  container.service('ApplicationManagement', ApplicationManagement, 'logger', 'cpsClientOptions');
  container.service('VoiceProvisioningManagement', VoiceProvisioningManagement, 'logger', 'cpsClientOptions');
  container.service('VerificationManagement', VerificationManagement, 'logger', 'cpsClientOptions');
  container.service('CertificateManagement', CertificateManagement, 'logger', 'cpsClientOptions');
  container.service('NotificationManagement', NotificationManagement, 'logger', 'cpsClientOptions');
  container.service('SmsRealmManagement', SmsRealmManagement, 'logger', 'cpsClientOptions');
  container.service('SmsServicePlanManagement', SmsServicePlanManagement, 'logger', 'cpsClientOptions');
  container.service('MaaiiRateManagement', MaaiiRateManagement, 'logger', 'maaiiRateClientOptions');
  // IAM services
  container.service('CompanyManagement', CompanyManagement, 'logger', 'iamClientOptions');
  container.service('AccessManagement', AccessManagement, 'logger', 'iamClientOptions');
  // BOSS services
  container.service('BossProvisionManagement', BossProvisionManagement, 'logger', 'bossClientOptions');
  // sign up rule services
  container.service('SignUpRuleMgmt', SignUpRuleMgmt, 'logger', 'signUpRuleClientOptions');

  // Models
  container.service('Provisioning', createProvisioningModel, 'mongooseConnection');
  container.service('Preset', createPresetModel, 'mongooseConnection');
  container.service('RateTable', createRateTableModel, 'mongooseConnection');
  container.service('SmsRateTable', createSmsRateTableModel, 'RateTable');
  container.service('OffNetCallRateTable', createOffNetCallRateTableModel, 'RateTable');
  container.service('ExchangeRateTable', createExchangeRateTableModel, 'RateTable');
  container.service('BillingPlan', createBillingPlanModel, 'mongooseConnection');
  container.factory('models', c => ({
    Provisioning: c.Provisioning,
    Preset: c.Preset,
    RateTable: c.RateTable,
    ExchangeRateTable: c.ExchangeRateTable,
    SmsRateTable: c.SmsRateTable,
    OffNetCallRateTable: c.OffNetCallRateTable,
    BillingPlan: c.BillingPlan,
  }));

  // Storage services
  container.service(
    'MongoTemplateKeyValueStorage',
    mongoKeyValueStorage,
    'mongooseConnection',
    'mongoTemplateStorageOptions'
  );
  container.factory('TemplateStorage', c => {
    const mongoStorage = c.MongoTemplateKeyValueStorage;
    const memoryStorage = memoryKeyValueStorage(templates);
    return compositeKeyValueStorage([mongoStorage, memoryStorage]);
  });

  // MPS exposed and internal services
  container.service('PresetService', presetService, 'Preset');
  container.service('ProvisioningService', provisioningService, 'logger', 'Provisioning', 'eventBus');
  container.service('TemplateService', templateService, 'TemplateStorage');
  container.service('BillingPlanService', billingPlanService, 'models');

  return container;
}

export default register;
