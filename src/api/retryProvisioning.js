import logger from '../initializer/logger';
import container from '../ioc';

import { InvalidOperationError } from 'common-errors';

const { provisioningManager } = container;
const ERROR_STATUS = 'ERROR';

/**
* @api {post} /provisioning/retry/{provision_id} Retry Provisioning Operation
* @apiName RetryProvisioning
* @apiGroup Provisioning
*
* @apiParams {String} provision_id
*
* @apiSuccess {String} provision_id.
* @apiSuccess {String} company_id.
* @apiSuccess {String} company_code.
* @apiSuccess {String} carrier_id.
*/
export default (req, res, next) => {
  const { provision_id } = req.params;

  provisioningManager
    .getRecord(provision_id)
    .then(model => {
      const isError = model.getStatus() === ERROR_STATUS;

      if (!isError) {
        next(new InvalidOperationError('You can only retry when the process is failed'));
        return;
      }

      model.clearStatus(() => {
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
      });
    })
    .catch(error => next(error));
};
