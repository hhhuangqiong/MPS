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
  MumsSignUpRuleMgmt,
} from './external';
import presetService from './presetService';
import provisioningService from './provisioningService';
import {
  createProvisioningModel,
  createPresetModel,
} from './models';
export * from './models';
export * from './util';
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
  // IAM services
  container.service('CompanyManagement', CompanyManagement, 'logger', 'iamApiOptions');
  container.service('AccessManagement', AccessManagement, 'logger', 'iamApiOptions');
  // BOSS services
  container.service('BossProvisionManagement', BossProvisionManagement, 'logger', 'bossApiOptions');
  // MUMS services
  container.service('MumsSignUpRuleMgmt', MumsSignUpRuleMgmt, 'logger', 'mumsApiOptions');

  // Models
  container.service('Provisioning', createProvisioningModel, 'mongooseConnection');
  container.service('Preset', createPresetModel, 'mongooseConnection');
  container.factory('models', c => ({
    Provisioning: c.Provisioning,
    Preset: c.Preset,
  }));

  // MPS (exposed) services
  container.service('PresetService', presetService, 'Preset');
  container.service('ProvisioningService', provisioningService, 'logger', 'Provisioning', 'eventBus');
  return container;
}

export default register;
