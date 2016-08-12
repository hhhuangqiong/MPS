/* eslint-disable max-len */
import Bottle from 'bottlejs';
import path from 'path';

import CarrierManagement from './requests/CarrierManagement';
import CapabilitiesManagement from './requests/CapabilitiesManagement';
// import FeatureSetManagementFactory from './requests/FeatureSetManagementFactory';
// import ApplicationManagementFactory from './requests/ApplicationManagementFactory';
// import provisioningService from './service/provisioning';

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
// ioc.service('provisioningService', provisioningService, 'processManager');

// const capabilitiesManagementFactory = new CapabilitiesManagementFactory(CPS_API);
// const featureSetManagementFactory = new FeatureSetManagementFactory(CPS_API);
// const applicationManagementFactory = new ApplicationManagementFactory(CPS_API);

// Carrier Management
ioc.factory('CarrierManagement', () => new CarrierManagement(nconf.get('cps:uri')));

// Capabilities Management
ioc.factory('CapabilitiesManagement', () => new CapabilitiesManagement(nconf.get('cps:uri')));

// Feature Set Management
// ioc.factory('featureSetManagementFactory.getFeatureSetTemplateRequest', () => featureSetManagementFactory.getFeatureSetTemplateRequest('/1.0/feature_sets/templates'));
// ioc.factory('featureSetManagementFactory.createFeatureSetRequest', () => featureSetManagementFactory.createFeatureSetRequest('/1.0/feature_sets'));

// Application Management
// ioc.factory('applicationManagementFactory.saveApplicationRequest', () => applicationManagementFactory.saveApplicationRequest('/1.0/applications'));

export default ioc;
