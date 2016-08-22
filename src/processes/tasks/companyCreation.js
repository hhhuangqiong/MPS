import ioc from '../../ioc';
import logger from '../../utils/logger';
import { createTask } from '../util/task';
import _ from 'lodash';
import { ReferenceError, NotImplementedError } from 'common-errors';

const CompanyManagement = ioc.container.CompanyManagement;

function validateRerun(profile, taskResult) {
  if (taskResult.companyId) {
    // run successfully before, skip
    return false;
  }

  return true;
}


function run(data, cb) {
  const { companyInfo, country, isReseller, resellerCompanyId } = data;

  if (isReseller) {
    cb(new NotImplementedError('Provisioning reseller company is not supported yet'));
    return;
  }

  const params = _.extend({ country, reseller: isReseller, parent: resellerCompanyId }, companyInfo);

  logger('debug', 'IAM create Company request sent');
  CompanyManagement.createCompany(params)
    .then(response => {
      logger('debug', 'IAM create Company response received');
      const { id } = response.body;

      if (!id) {
        throw new ReferenceError('id is not defined in response body for carrier creation');
      }

      cb(null, { companyId: id });
    })
    .catch(cb);
}

export default createTask('COMPANY_CREATION', run, { validateRerun });
