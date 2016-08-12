/* eslint-disable max-len */
import Bottle from 'bottlejs';
import path from 'path';

import CarrierManagement from './requests/CarrierManagement';
// import CapabilitiesManagementFactory from './requests/CapabilitiesManagementFactory';
// import FeatureSetManagementFactory from './requests/FeatureSetManagementFactory';
// import ApplicationManagementFactory from './requests/ApplicationManagementFactory';
import provisioningService from './service/provisioning';

const ioc = new Bottle();
const nconf = require('m800-initializers/lib/nconf')(path.resolve(__dirname, '../config'));

// configuations
ioc.constant('config.cps', nconf.get('cps'));
ioc.constant('config.mongo', nconf.get('mongo'));

// resources/dependencies
ioc.factory('logger', () => require('./initializer/logger').default);
ioc.factory('mongoose', () => (require('./initializer/mongoose').default(nconf.get('mongo:uri'))));
ioc.factory('processManager', () => (require('./initializer/bpmn').default(nconf.get('mongo:uri'))));

// services
ioc.service('provisioningService', provisioningService, 'processManager');

// const capabilitiesManagementFactory = new CapabilitiesManagementFactory(CPS_API);
// const featureSetManagementFactory = new FeatureSetManagementFactory(CPS_API);
// const applicationManagementFactory = new ApplicationManagementFactory(CPS_API);

// Carrier Management
ioc.factory('CarrierManagement', () => new CarrierManagement(nconf.get('cps:uri')));

// Capabilities Management (General)
// ioc.factory('capabilityManagement.enableImCapability', () => capabilitiesManagementFactory.enableCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.im', 'IM'));
// ioc.factory('capabilityManagement.enableOffnetCapability', () => capabilitiesManagementFactory.enableCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.offnet', 'OffNet'));
// ioc.factory('capabilityManagement.enableOnnetCapability', () => capabilitiesManagementFactory.enableCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.onnet', 'OnNet'));
// ioc.factory('capabilityManagement.enablePushCapability', () => capabilitiesManagementFactory.enableCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.push', 'Push'));
// ioc.factory('capabilityManagement.enableTopUpCapability', () => capabilitiesManagementFactory.enableCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.topup', 'TopUp'));
//
// // Capabilities Management (Specific)
// ioc.factory('capabilityManagement.enableApiCapability', () => capabilitiesManagementFactory.enableApiCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.api', 'API'));
// ioc.factory('capabilityManagement.enableVoiceCapability', () => capabilitiesManagementFactory.enableVoiceCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.voice', 'Voice'));
// ioc.factory('capabilityManagement.enableSmsCapability', () => capabilitiesManagementFactory.enableSmsCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.sms', 'SMS'));
// ioc.factory('capabilityManagement.enableImToSmsCapability', () => capabilitiesManagementFactory.enableImToSmsCapabilityRequest('/1.0/carriers/:carrierId/capabilities/com.maaii.carrier.capability.imtosms', 'ImToSms'));
//
// // Feature Set Management
// ioc.factory('featureSetManagementFactory.getFeatureSetTemplateRequest', () => featureSetManagementFactory.getFeatureSetTemplateRequest('/1.0/feature_sets/templates'));
// ioc.factory('featureSetManagementFactory.createFeatureSetRequest', () => featureSetManagementFactory.createFeatureSetRequest('/1.0/feature_sets'));

// // Application Management
// ioc.factory('applicationManagementFactory.saveApplicationRequest', () => applicationManagementFactory.saveApplicationRequest('/1.0/applications'));

export default ioc;
