/* eslint-disable max-len */
import _ from 'lodash';
import Bottle from 'bottlejs';
import path from 'path';


import BossProvisionManagement from './requests/BossProvisionManagement';
import CompanyManagement from './requests/CompanyManagement';
import CarrierManagement from './requests/CarrierManagement';
import CapabilitiesManagement from './requests/CapabilitiesManagement';
import FeatureSetManagement from './requests/FeatureSetManagement';
import ApplicationManagement from './requests/ApplicationManagement';
import VoiceProvisioningManagement from './requests/VoiceProvisioningManagement';
import VerificationManagement from './requests/VerificationManagement';
import CertificateManagement from './requests/CertificateManagement';
import NotificationManagement from './requests/NotificationManagement';
import AccessManagement from './requests/AccessManagement';

import provisioningProcessor from './processes/provisioning';
import provisioningService from './service/provisioning';
import presetService from './service/preset';

import { parseObjectArrays } from './utils/nconf';

const ioc = new Bottle();
const nconf = require('m800-initializers/lib/nconf')(path.resolve(__dirname, '../config'));

// configuations
ioc.constant('cpsConfig', parseObjectArrays(nconf.get('cps')));
ioc.constant('bossConfig', parseObjectArrays(nconf.get('boss')));
ioc.constant('iamConfig', parseObjectArrays(nconf.get('iam')));

// resources/dependencies
/* eslint-disable global-require */
ioc.factory('mongoose', () => (require('./initializer/mongoose').default(nconf.get('mongodb:uri'))));
ioc.factory('processManager', () => (require('./initializer/bpmn').default(nconf.get('mongodb:uri'))));
ioc.factory('validator', () => (require('./utils/validator').default()));
/* eslint-enable */

// services
ioc.service('provisioningProcessor', provisioningProcessor, 'processManager');
ioc.service('provisioningService', provisioningService, 'provisioningProcessor', 'validator');
ioc.service('presetService', presetService, 'validator');

// request objects
ioc.factory('CarrierManagement', () => new CarrierManagement(nconf.get('cps:api')));
ioc.factory('CapabilitiesManagement', () => new CapabilitiesManagement(nconf.get('cps:api')));
ioc.factory('FeatureSetManagement', () => new FeatureSetManagement(nconf.get('cps:api')));
ioc.factory('ApplicationManagement', () => new ApplicationManagement(nconf.get('cps:api')));
ioc.factory('VoiceProvisioningManagement', () => new VoiceProvisioningManagement(nconf.get('cps:api')));
ioc.factory('VerificationManagement', () => new VerificationManagement(nconf.get('cps:api')));
ioc.factory('CertificateManagement', () => new CertificateManagement(nconf.get('cps:api')));

ioc.factory('NotificationManagement', () => new NotificationManagement(nconf.get('cps:api')));

ioc.factory('CompanyManagement', (container) => {
  const iamConfig = nconf.get('iam:api');
  return new CompanyManagement(_.extend(iamConfig, { validator: container.validator }));
});

ioc.factory('AccessManagement', (container) => {
  const iamConfig = nconf.get('iam:api');
  return new AccessManagement(_.extend(iamConfig, { validator: container.validator }));
});

ioc.factory('BossProvisionManagement', () => new BossProvisionManagement(nconf.get('boss:api')));


export default ioc;
