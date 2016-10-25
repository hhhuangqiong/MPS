import m800Config from 'm800-initializers/lib/nconf';
import _ from 'lodash';

import { parseObjectArrays } from './configUtil';

const CONFIG_PATH = __dirname;

const nconf = m800Config(CONFIG_PATH);

const config = nconf.get();
const SERVICES = ['cps', 'boss', 'iam', 'mums'];
_.each(SERVICES, service => {
  config[service] = parseObjectArrays(config[service]);
});

export default config;
