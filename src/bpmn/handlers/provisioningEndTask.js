import { check, getProperty } from './util';

export function createProvisioningEndTask(logger, provisioningService) {
  check.ok('logger', logger);
  check.ok('provisioningService', provisioningService);

  return async function run(data, done) {
    logger.info('Provisioning process ended');

    const taskResults = getProperty(this, 'taskResults') || {};
    const taskErrors = getProperty(this, 'taskErrors') || {};
    const ownerId = getProperty(this, 'ownerId');

    const result = { ownerId, taskResults, taskErrors };
    await provisioningService.completeProvisioning(result);
    done(data);
  };
}

export default createProvisioningEndTask;
