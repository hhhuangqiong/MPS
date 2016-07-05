import Joi from 'joi';
import validateSchema from '../utils/validateSchema';

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
* @apiParam {String} reseller_carrier_id.
* @apiParam {String} payment_mode.
*
* @apiSuccess {String} Not implemented.
*/
export default (req, res, next) => {
  const validationError = validateSchema(req.param, {
    company_id: Joi.string().required(),
    carrier_id: Joi.string().required(),
    company_name: Joi.string().required(),
    capabilities: Joi.array(),
    service_type: Joi.string().uppercase().valid('SDK').valid('WHITE_LABEL'),
    reseller_carrier_id: Joi.string(),
    payment_mode: Joi.string(),
  });

  if (validationError) {
    next(validationError);
    return;
  }
};
