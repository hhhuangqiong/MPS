/* eslint-disable max-len */
import Bottle from 'bottlejs';
import path from 'path';

import CarrierManagement from './requests/CarrierManagement';
import CapabilitiesManagement from './requests/CapabilitiesManagement';
import FeatureSetManagement from './requests/FeatureSetManagement';
import ApplicationManagement from './requests/ApplicationManagement';
import VoiceProvisioningManagement from './requests/VoiceProvisioningManagement';
import VerificationManagement from './requests/VerificationManagement';
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

// request objects
ioc.factory('CarrierManagement', () => new CarrierManagement(nconf.get('cps:uri')));
ioc.factory('CapabilitiesManagement', () => new CapabilitiesManagement(nconf.get('cps:uri')));
ioc.factory('FeatureSetManagement', () => new FeatureSetManagement(nconf.get('cps:uri')));
ioc.factory('ApplicationManagement', () => new ApplicationManagement(nconf.get('cps:uri')));
ioc.factory('VoiceProvisioningManagement', () => new VoiceProvisioningManagement(nconf.get('cps:uri')));
ioc.factory('VerificationManagement', () => new VerificationManagement(nconf.get('cps:uri')));

export default ioc;
