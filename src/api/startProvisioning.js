import Joi from 'joi';
import validateSchema from '../utils/validateSchema';

import logger from '../initializer/logger';

import container from '../ioc';
const { bpmnManager } = container;

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
* @apiSuccess {String} Not implemented.
*/
export default (req, res, next) => {
  const validationError = validateSchema(req.body, {
    company_id: Joi.string().required(),
    company_name: Joi.string().required(),
    capabilities: Joi.array(),
    service_type: Joi.string().uppercase().valid('SDK', 'WHITE_LABEL'),
    parent_company_id: Joi.string(),
    payment_mode: Joi.string(),
  });

  if (validationError) {
    next(validationError);
    return;
  }

  logger('Provisioning Started', req.body);

  bpmnManager
    .createRecord(req.body)
    .then(() => {
      res.sendStatus(200);

      bpmnManager
        .start()
        .then(result => {
          logger('Provisioning result', result.views);
        })
        .catch(error => {
          logger('error', error);
        });
    })
    .catch(error => {
      next(error);
    });
};
