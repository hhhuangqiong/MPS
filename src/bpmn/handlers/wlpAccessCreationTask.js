import { ReferenceError, NotImplementedError, ArgumentNullError } from 'common-errors';
import { check } from 'm800-util';

import { WLP_ACCESS_CREATION } from './bpmnEvents';

export function createWlpAccessCreationTask(templateService, accessManagement) {
  check.ok('templateService', templateService);
  check.ok('accessManagement', accessManagement);

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
    if (!companyId) {
      throw new ArgumentNullError('companyId');
    }
    const params = await templateService.render('iam.adminRole', { companyId });
    // Unset company management permission for non reseller
    params.permissions.company = [];

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
