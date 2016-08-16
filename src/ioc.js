/* eslint-disable max-len */
import Bottle from 'bottlejs';
import path from 'path';


import CompanyManagement from './requests/CompanyManagement';
import CarrierManagement from './requests/CarrierManagement';
import CapabilitiesManagement from './requests/CapabilitiesManagement';
import FeatureSetManagement from './requests/FeatureSetManagement';
import ApplicationManagement from './requests/ApplicationManagement';
import VoiceProvisioningManagement from './requests/VoiceProvisioningManagement';
import VerificationManagement from './requests/VerificationManagement';
import provisioningProcessor from './processes/provisioning';
import provisioningService from './service/provisioning';
import presetService from './service/preset';

const ioc = new Bottle();
const nconf = require('m800-initializers/lib/nconf')(path.resolve(__dirname, '../config'));

// configuations
ioc.constant('config', nconf.get());

// resources/dependencies
/* eslint-disable global-require */
ioc.factory('mongoose', () => (require('./initializer/mongoose').default(nconf.get('mongo:uri'))));
ioc.factory('processManager', () => (require('./initializer/bpmn').default(nconf.get('mongo:uri'))));
ioc.factory('validator', () => (require('./utils/validator').default()));
/* eslint-enable */

// services
ioc.service('provisioningProcessor', provisioningProcessor, 'processManager');
ioc.service('provisioningService', provisioningService, 'provisioningProcessor', 'validator');
ioc.service('presetService', presetService, 'validator');

// request objects
ioc.factory('CarrierManagement', () => new CarrierManagement(nconf.get('cps:uri')));
ioc.factory('CapabilitiesManagement', () => new CapabilitiesManagement(nconf.get('cps:uri')));
ioc.factory('FeatureSetManagement', () => new FeatureSetManagement(nconf.get('cps:uri')));
ioc.factory('ApplicationManagement', () => new ApplicationManagement(nconf.get('cps:uri')));
ioc.factory('VoiceProvisioningManagement', () => new VoiceProvisioningManagement(nconf.get('cps:uri')));
ioc.factory('VerificationManagement', () => new VerificationManagement(nconf.get('cps:uri')));
ioc.factory('CompanyManagement', (container) => {
  const { uri } = nconf.get('iam');
  return new CompanyManagement({ baseUri: uri, validator: container.validator });
});

export default ioc;
