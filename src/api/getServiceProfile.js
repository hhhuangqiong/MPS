import container from '../ioc';
const { provisioningManager } = container;

/**
* @api {get} /provisioning/profile/{company_id} Get Service Profile
* @apiName GetServiceProfile
* @apiGroup Provisioning
*
* @apiParams {String} company_id
*
* @apiSuccess {String} company_code.
* @apiSuccess {Array} capabilities.
* @apiSuccess {String} reseller_carrier_id.
* @apiSuccess {String} service_type.
* @apiSuccess {String} payment_mode.
*/
export default (req, res, next) => {
  const { company_id } = req.params;

  provisioningManager
    .getServiceProfile(company_id)
    .then(result => res.json(result))
    .catch(error => next(error));
};
