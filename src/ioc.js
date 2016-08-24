/* eslint-disable max-len */
import _ from 'lodash';
import Bottle from 'bottlejs';
import path from 'path';


import CompanyManagement from './requests/CompanyManagement';
import CarrierManagement from './requests/CarrierManagement';
import CapabilitiesManagement from './requests/CapabilitiesManagement';
import FeatureSetManagement from './requests/FeatureSetManagement';
import ApplicationManagement from './requests/ApplicationManagement';
import VoiceProvisioningManagement from './requests/VoiceProvisioningManagement';
import VerificationManagement from './requests/VerificationManagement';
import CertificateManagement from './requests/CertificateManagement';

import provisioningProcessor from './processes/provisioning';
import provisioningService from './service/provisioning';
import presetService from './service/preset';

import { parseObjectArrays } from './utils/nconf';

const ioc = new Bottle();
const nconf = require('m800-initializers/lib/nconf')(path.resolve(__dirname, '../config'));

// configuations
ioc.constant('cpsConfig', parseObjectArrays(nconf.get('cps')));

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
ioc.factory('CarrierManagement', () => new CarrierManagement(nconf.get('cps')));
ioc.factory('CapabilitiesManagement', () => new CapabilitiesManagement(nconf.get('cps')));
ioc.factory('FeatureSetManagement', () => new FeatureSetManagement(nconf.get('cps')));
ioc.factory('ApplicationManagement', () => new ApplicationManagement(nconf.get('cps')));
ioc.factory('VoiceProvisioningManagement', () => new VoiceProvisioningManagement(nconf.get('cps')));
ioc.factory('VerificationManagement', () => new VerificationManagement(nconf.get('cps')));
ioc.factory('CertificateManagement', () => new CertificateManagement(nconf.get('cps')));

ioc.factory('CompanyManagement', (container) => {
  const imaConfig = nconf.get('iam');
  return new CompanyManagement(_.extend(imaConfig, { validator: container.validator }));
});


export default ioc;
