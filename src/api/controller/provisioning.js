import _ from 'lodash';
import ioc from '../../ioc';
import logger from '../../utils/logger';

const { provisioningService } = ioc.container;

export async function createProvisioning(req, res, next) {
  try {
    const result = await provisioningService.createProvisioning(req.body);
    res.json(result);
  } catch (e) {
    logger('error', 'createProvisioning: Error caught ', e.stack);
    next(e);
  }
}

export async function getProvisioning(req, res, next) {
  const query = req.query;
  const params = req.params;

  try {
    const command = _.extend({}, params, query);
    const provisionings = await provisioningService.getProvisionings(command);
    res.json(provisionings);
  } catch (e) {
    logger('error', 'getProvisioning: Error caught ', e.stack);
    next(e);
  }
}

export async function updateProvisioning(req, res, next) {
  try {
    const command = _.extend({}, req.params, { profile: req.body });
    const provisioning = await provisioningService.updateProvisioning(command);
    res.json(provisioning);
  } catch (e) {
    logger('error', 'updateProvisioning: Error caught ', e.stack);
    next(e);
  }
}
