import logger from '../initializer/logger';

import container from '../ioc';
const { provisioningManager } = container;

/**
* @api {post} /provisioning Start Provisioning Request
* @apiName StartProvisioning
* @apiGroup Provisioning
*
* @apiParam {String} company_id.
* @apiParam {String} carrier_id.
* @apiParam {String} company_name.
* @apiParam {Array} capabilities.
* @apiParam {String} service_type.
* @apiParam {String} parent_company_id.
* @apiParam {String} payment_mode.
*
* @apiSuccess {String} provision_id.
* @apiSuccess {String} company_id.
* @apiSuccess {String} company_code.
* @apiSuccess {String} carrier_id.
*/
export default (req, res, next) => {
  const params = Object.assign({}, req.body);

  provisioningManager
    .createRecord(params)
    .then(model => {
      res.json({
        provision_id: model._id,
        company_code: model.company_code,
        company_id: model.company_id,
        carrier_id: model.getCarrierId(),
      });

      provisioningManager
        .start({ model })
        .then(result => logger(result))
        .catch(error => logger('error', error));
    })
    .catch(error => next(error));
};
