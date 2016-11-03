import _ from 'lodash';
import { ReferenceError, NotImplementedError } from 'common-errors';

import { check } from './../../util';
import { COMPANY_CREATION } from './bpmnEvents';

export function createCompanyCreationTask(companyManagement) {
  check.ok('companyManagement', companyManagement);

  async function createCompany(state, profile, context) {
    if (state.results.companyId) {
      return null;
    }
    const { logger } = context;
    const { companyInfo, country, isReseller, resellerCompanyId } = profile;
    if (isReseller) {
      throw new NotImplementedError('Provisioning reseller company is not supported yet');
    }
    const params = _.extend({ country, reseller: isReseller, parent: resellerCompanyId }, companyInfo);
    logger.debug('IAM create Company request sent');
    const response = await companyManagement.createCompany(params);
    const { id } = response.body;
    if (!id) {
      throw new ReferenceError('id is not defined in response body for carrier creation');
    }

    return {
      results: {
        companyId: id,
      },
    };
  }

  createCompany.$meta = {
    name: COMPANY_CREATION,
  };

  return createCompany;
}

export default createCompanyCreationTask;
