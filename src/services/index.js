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
import {
  memoryKeyValueStorage,
  mongoKeyValueStorage,
  compositeKeyValueStorage,
} from './storage';
import templates from './templates.json';
import {
  createProvisioningModel,
  createPresetModel,
} from './models';

export * from './models';
export * from './util';
export * from './storage';
export * from './presetService';
export * from './provisioningService';

export function register(container) {
  // CPS services
  container.service('CarrierManagement', CarrierManagement, 'logger', 'cpsApiOptions');
  container.service('CapabilitiesManagement', CapabilitiesManagement, 'logger', 'cpsApiOptions');
  container.service('FeatureSetManagement', FeatureSetManagement, 'logger', 'cpsApiOptions');
  container.service('ApplicationManagement', ApplicationManagement, 'logger', 'cpsApiOptions');
  container.service('VoiceProvisioningManagement', VoiceProvisioningManagement, 'logger', 'cpsApiOptions');
  container.service('VerificationManagement', VerificationManagement, 'logger', 'cpsApiOptions');
  container.service('CertificateManagement', CertificateManagement, 'logger', 'cpsApiOptions');
  container.service('NotificationManagement', NotificationManagement, 'logger', 'cpsApiOptions');
  container.service('SmsRealmManagement', SmsRealmManagement, 'logger', 'cpsApiOptions');
  container.service('SmsServicePlanManagement', SmsServicePlanManagement, 'logger', 'cpsApiOptions');
  container.service('MaaiiRateManagement', MaaiiRateManagement, 'logger', 'maaiiRateOptions');
  // IAM services
  container.service('CompanyManagement', CompanyManagement, 'logger', 'iamApiOptions');
  container.service('AccessManagement', AccessManagement, 'logger', 'iamApiOptions');
  // BOSS services
  container.service('BossProvisionManagement', BossProvisionManagement, 'logger', 'bossApiOptions');
  // sign up rule services
  container.service('SignUpRuleMgmt', SignUpRuleMgmt, 'logger', 'signUpRuleApiOptions');

  // Models
  container.service('Provisioning', createProvisioningModel, 'mongooseConnection');
  container.service('Preset', createPresetModel, 'mongooseConnection');
  container.factory('models', c => ({
    Provisioning: c.Provisioning,
    Preset: c.Preset,
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

  return container;
}

export default register;
