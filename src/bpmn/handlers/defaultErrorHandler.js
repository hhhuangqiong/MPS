import { check, getProperty } from './util';

export function createDefaultErrorHandler(logger) {
  check.ok('logger', logger);

  return function defaultErrorHandler(error, done) {
    const ownerId = getProperty(this, 'ownerId');
    logger.info(`[${ownerId}] error caught within task `, error.stack);
    const taskErrors = { UNKNOWN_TASK: error };
    // set as taskErrors for tasks beyond this point
    done({ taskErrors });
  };
}

export default createDefaultErrorHandler;
