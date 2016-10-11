import { check } from './util';

export function createProvisioningStartTask(logger) {
  check.ok('logger', logger);
  return function run(data, done) {
    logger.info('Provisioning process started');
    done(data);
  };
}

export default createProvisioningStartTask;
