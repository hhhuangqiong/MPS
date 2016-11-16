import path from 'path';

import _ from 'lodash';
import nconf from 'nconf';

import { parseObjectArrays } from './configUtil';

const ROOT = __dirname;
const ENV = process.env.NODE_ENV || 'development';

nconf
  .argv()
  .env({ separator: '__' })
  .file('env-user-file', path.join(ROOT, `${ENV}.personal.json`))
  .file('env-file', path.join(ROOT, `${ENV}.json`))
  .file('default-user-file', path.join(ROOT, 'default.personal.json'))
  .file('default-file', path.join(ROOT, 'default.json'));

const config = nconf.get();
const SERVICES = ['cps', 'boss', 'iam', 'signUpRule'];
_.each(SERVICES, service => {
  config[service] = parseObjectArrays(config[service]);
});

export default config;
