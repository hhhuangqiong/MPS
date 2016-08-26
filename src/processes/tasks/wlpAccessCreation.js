import _ from 'lodash';
import { ReferenceError, NotImplementedError, ArgumentNullError } from 'common-errors';
import ioc from '../../ioc';
import logger from '../../utils/logger';
import { createTask } from '../util/task';

import { compileJsonTemplate } from '../../utils/nconf';

const { iamConfig, AccessManagement } = ioc.container;
const { adminRoleTemplate } = iamConfig;

function validateRerun(profile, taskResult) {
  if (taskResult.done) {
    // run successfully before, skip
    return false;
  }

  return true;
}


function run(data, cb) {
  const { companyId, isReseller } = data;

  if (isReseller) {
    cb(new NotImplementedError('Provisioning reseller company is not supported yet'));
    return;
  }
  const template = _.clone(adminRoleTemplate);
  // unset company mgmt permission for non reseller
  template.permissions.company = [];

  if (!companyId) {
    cb(new ArgumentNullError('companyId'));
    return;
  }

  const params = compileJsonTemplate(template, data);

  logger('debug', 'IAM create role request sent');
  AccessManagement.createRole(params)
    .then(response => {
      logger('debug', 'IAM create role response received');
      const { name } = response.body;

      if (!name) {
        throw new ReferenceError('name is not defined in response body for role creation');
      }

      cb(null, { done: true });
    })
    .catch(cb);
}

export default createTask('WLP_ACCESS_CREATION', run, { validateRerun });
