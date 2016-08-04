import logger from '../../initializer/logger';
import container from '../../ioc';

import {
  InvalidOperationError,
  NotFoundError,
} from 'common-errors';

const { provisioningManager } = container;
const ERROR_STATUS = 'ERROR';

/**
* @api {post} /provisioning Start Provisioning Request
* @apiName startProvisioning
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
* @apiSuccess {String} provision_id.
* @apiSuccess {String} company_id.
* @apiSuccess {String} company_code.
* @apiSuccess {String} carrier_id.
*/
export function startProvisioning(req, res, next) {
  const params = Object.assign({}, req.body);

  provisioningManager
    .createRecord(params)
    .then(model => {
      res.json({
        /* eslint-disable no-underscore-dangle */
        provision_id: model._id,
        /* eslint-enable */
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
}

/**
* @api {get} /provisioning/companies Get Provisioning Companies Status
* @apiName getProvisioningStatusByCompanies
* @apiGroup Provisioning
*
* @apiQuery {String} company_id
*
* @apiSuccess {Array} company and it's status.
*/
export function getProvisioningStatusByCompanies(req, res, next) {
  const { company_id: companyIdQuery } = req.query;

  const companyIds = Array.isArray(companyIdQuery) ? companyIdQuery : companyIdQuery.split(',');

  provisioningManager
    .getProvisioningStatusByCompanyIds(companyIds)
    .then(result => res.json(result))
    .catch(error => next(error));
}

/**
* @api {get} /provisioning Get Provisioning Status
* @apiName getProvisioningStatus
* @apiGroup Provisioning
*
* @apiQuery {String} company_id
*
* @apiSuccess {Object} provisioningStatus.
*/
export function getProvisioningStatus(req, res, next) {
  provisioningManager
    .getProvisioningStatus(req.query.company_id)
    .then(result => res.json(result))
    .catch(error => next(error));
}

/**
* @api {post} /provisioning/retry/{provision_id} Retry Provisioning Operation
* @apiName retryProvisioning
* @apiGroup Provisioning
*
* @apiParams {String} provision_id
*
* @apiSuccess {String} provision_id.
* @apiSuccess {String} company_id.
* @apiSuccess {String} company_code.
* @apiSuccess {String} carrier_id.
*/
export function retryProvisioning(req, res, next) {
  const { provision_id } = req.params;

  provisioningManager
    .getRecord(provision_id)
    .then(model => {
      if (!model) {
        next(new NotFoundError('model'));
        return;
      }
      const isError = model.getStatus() === ERROR_STATUS;

      if (!isError) {
        next(new InvalidOperationError('You can only retry when the process is failed'));
        return;
      }

      model.clearStatus(() => {
        res.json({
          /* eslint-disable no-underscore-dangle */
          provision_id: model._id,
          /* eslint-enable */
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
}
