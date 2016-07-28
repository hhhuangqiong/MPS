/* eslint-disable max-len */
import Bottle from 'bottlejs';

import CarrierManagementFactory from './requests/CarrierManagementFactory';
import CapabilitiesManagementFactory from './requests/CapabilitiesManagementFactory';
import FeatureSetManagementFactory from './requests/FeatureSetManagementFactory';
import ApplicationManagementFactory from './requests/ApplicationManagementFactory';

import BpmnManager from './processes';

const ioc = new Bottle();
const { CPS_API, MONGODB_URI } = process.env;

ioc.factory('bpmnManager', () => new BpmnManager(MONGODB_URI, 'diagram', 'PROVISIONING_START'));

// External Requests
const carrierManagementFactory = new CarrierManagementFactory(CPS_API);
const capabilitiesManagementFactory = new CapabilitiesManagementFactory(CPS_API);
const featureSetManagementFactory = new FeatureSetManagementFactory(CPS_API);
const applicationManagementFactory = new ApplicationManagementFactory(CPS_API);

// Carrier Management
ioc.factory('carrierManagement.carrierCreationRequest', () => carrierManagementFactory.getCarrierCreationRequest('/1.0/carriers'));
ioc.factory('carrierManagement.carrierProfileCreationRequest', () => carrierManagementFactory.getCarrierProfileCreationRequest('/1.0/carriers/:carrierId/profiles'));
ioc.factory('carrierManagement.userCarrierProfileCreationRequest', () => carrierManagementFactory.getUserCarrierProfileCreationRequest('/1.0/carriers/:carrierId/users/profiles'));

// Capabilities Management (General)
ioc.factory('capabilityManagement.enableImCapability', () => capabilitiesManagementFactory.enableCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.im', 'IM'));
ioc.factory('capabilityManagement.enableOffnetCapability', () => capabilitiesManagementFactory.enableCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.offnet', 'OffNet'));
ioc.factory('capabilityManagement.enableOnnetCapability', () => capabilitiesManagementFactory.enableCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.onnet', 'OnNet'));
ioc.factory('capabilityManagement.enablePushCapability', () => capabilitiesManagementFactory.enableCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.push', 'Push'));
ioc.factory('capabilityManagement.enableTopUpCapability', () => capabilitiesManagementFactory.enableCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.topup', 'TopUp'));

// Capabilities Management (Specific)
ioc.factory('capabilityManagement.enableApiCapability', () => capabilitiesManagementFactory.enableApiCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.api', 'API'));
ioc.factory('capabilityManagement.enableVoiceCapability', () => capabilitiesManagementFactory.enableVoiceCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.voice', 'Voice'));
ioc.factory('capabilityManagement.enableSmsCapability', () => capabilitiesManagementFactory.enableSmsCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.sms', 'SMS'));
ioc.factory('capabilityManagement.enableImToSmsCapability', () => capabilitiesManagementFactory.enableImToSmsCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.imtosms', 'ImToSms'));

// Feature Set Management
ioc.factory('featureSetManagementFactory.getFeatureSetTemplateRequest', () => featureSetManagementFactory.getFeatureSetTemplateRequest('/1.0/feature_sets/templates'));
ioc.factory('featureSetManagementFactory.createFeatureSetRequest', () => featureSetManagementFactory.createFeatureSetRequest('/1.0/feature_sets'));

// Application Management
ioc.factory('applicationManagementFactory.saveApplicationRequest', () => applicationManagementFactory.saveApplicationRequest('/1.0/applications'));

export default ioc.container;
