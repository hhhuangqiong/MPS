import _ from 'lodash';
import ioc from '../../ioc';

const { logger, provisioningService } = ioc.container;

export function* createProvisioning(req, res, next) {
  try {
    const result = yield provisioningService.createProvisioning(req.body);
    res.json(result);
  } catch (e) {
    logger('error', 'createProvisioning: Error caught ', e.stack);
    next(e);
  }
}

export function* getProvisioning(req, res, next) {
  const query = req.query;

  if (query.companyId) query.companyId = query.companyId.split(',');
  if (query.serviceType) query.serviceType = query.serviceType.companyId.split(',');
  if (query.companyCode) query.companyCode = query.companyCode.companyId.split(',');

  try {
    const provisionings = yield provisioningService.getProvisionings(query);
    res.json(provisionings.toJson());
  } catch (e) {
    logger('error', 'getProvisioning: Error caught ', e.stack);
    next(e);
  }
}

export function* updateProvisioning(req, res, next) {
  try {
    const command = _.extend({}, req.params, req.body);
    const provisioning = yield provisioningService.updateProvisioning(command);
    res.json(provisioning.toJson());
  } catch (e) {
    logger('error', 'updateProvisioning: Error caught ', e.stack);
    next(e);
  }
}
