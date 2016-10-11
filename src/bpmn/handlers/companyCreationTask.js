import _ from 'lodash';
import { ReferenceError, NotImplementedError } from 'common-errors';

import { check, createTask } from './util';

export function createCompanyCreationTask(logger, companyManagement) {
  check.ok('logger', logger);
  check.ok('companyManagement', companyManagement);

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

    logger.debug('IAM create Company request sent');
    companyManagement.createCompany(params)
      .then(response => {
        logger.debug('IAM create Company response received');
        const { id } = response.body;

        if (!id) {
          throw new ReferenceError('id is not defined in response body for carrier creation');
        }

        cb(null, { companyId: id });
      })
      .catch(cb);
  }

  return createTask('COMPANY_CREATION', run, { validateRerun }, logger);
}

export default createCompanyCreationTask;
