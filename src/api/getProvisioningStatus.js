import Joi from 'joi';
import validateSchema from '../utils/validateSchema';

import container from '../ioc';
const { bpmnManager } = container;

/**
* @api {get} /provisioning Get Provisioning Status
* @apiName GetProvisioning
* @apiGroup Provisioning
*
* @apiQuery {String} company_id
*
* @apiSuccess {Object} provisioningStatus.
*/
export default (req, res, next) => {
  const validationError = validateSchema(req.query, {
    company_id: Joi.string().required(),
  });

  if (validationError) {
    next(validationError);
    return;
  }

  bpmnManager
    .getProvisioningStatus(req.query.company_id)
    .then(result => {
      res.json(result);
    })
    .catch(error => {
      next(error);
    });
};
