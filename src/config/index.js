import m800Config from 'm800-initializers/lib/nconf';
import _ from 'lodash';

import { parseObjectArrays } from './configUtil';

const CONFIG_PATH = __dirname;

const nconf = m800Config(CONFIG_PATH);

// TODO: template configuration shouldn't be a part of application config
// HACK: For JSON objects with keys are all parseable to integer, Convert it to an array
const SERVICES = ['cps', 'boss', 'iam', 'mums'];
_.each(SERVICES, service => nconf.set(service, parseObjectArrays(nconf.get(service))));

export default nconf;
