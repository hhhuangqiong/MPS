import container from '../ioc';
const { provisioningManager } = container;

/**
* @api {get} /provisioning/companies Get Provisioning Companies Status
* @apiName GetProvisioningCompaniesStatus
* @apiGroup Provisioning
*
* @apiQuery {String} company_id
*
* @apiSuccess {Array} company and it's status.
*/
export default (req, res, next) => {
  const { company_id: companyIdQuery } = req.query;

  const companyIds = Array.isArray(companyIdQuery) ? companyIdQuery : companyIdQuery.split(',');

  provisioningManager
    .getProvisioningStatusByCompanyIds(companyIds)
    .then(result => res.json(result))
    .catch(error => next(error));
};
