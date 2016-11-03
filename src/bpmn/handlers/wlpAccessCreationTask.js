import _ from 'lodash';
import { ReferenceError, NotImplementedError, ArgumentNullError } from 'common-errors';

import { check } from './../../util';
import { compileJsonTemplate } from './common';
import { WLP_ACCESS_CREATION } from './bpmnEvents';

export function createWlpAccessCreationTask(iamOptions, accessManagement) {
  check.ok('iamOptions', iamOptions);
  check.ok('accessManagement', accessManagement);

  const { adminRoleTemplate } = iamOptions;

  async function createAdminRole(state, profile, context) {
    if (state.results.adminRoleCreated) {
      return null;
    }
    const { logger } = context;
    const { isReseller } = profile;
    const { companyId } = state.results;
    if (isReseller) {
      throw new NotImplementedError('Provisioning reseller company is not supported yet');
    }
    const template = _.clone(adminRoleTemplate);
    // unset company mgmt permission for non reseller
    template.permissions.company = [];
    if (!companyId) {
      throw new ArgumentNullError('companyId');
    }
    const params = compileJsonTemplate(template, { companyId });

    logger.debug('IAM create role request sent');
    const response = await accessManagement.createRole(params);
    logger.debug('IAM create role response received');
    const { name } = response.body;
    if (!name) {
      throw new ReferenceError('name is not defined in response body for role creation');
    }
    return {
      results: {
        adminRoleCreated: true,
      },
    };
  }

  createAdminRole.$meta = {
    name: WLP_ACCESS_CREATION,
  };

  return createAdminRole;
}

export default createWlpAccessCreationTask;
