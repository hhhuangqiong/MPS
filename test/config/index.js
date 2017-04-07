import path from 'path';
import nconf from 'nconf';

const ROOT = __dirname;
const CI = process.env.CI;

if (CI) {
  nconf.file('ci-file', path.join(ROOT, 'ci.json'));
}

nconf
  .file('default-user-file', path.join(ROOT, 'default.personal.json'))
  .file('default-file', path.join(ROOT, 'default.json'));

const config = nconf.get();

export default config;
