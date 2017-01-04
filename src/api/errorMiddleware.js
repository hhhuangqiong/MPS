import _ from 'lodash';
import serializeError from 'serialize-error';
import { check } from 'm800-util';

import { formatError, isClientError } from './../util';

export function createErrorMiddleware(logger, env) {
  check.ok('logger', logger);
  check.predicate('env', env, _.isString);

  // eslint-disable-next-line no-unused-vars
  return function errorMiddleware(err, req, res, next) {
    if (!err) {
      logger.warning(`Falsey error in error middleware: ${err}`, err);
      next();
    }
    if (!err instanceof Error) {
      logger.warning(`Weird error which is not instanceof Error in error middleware: ${err}.`, err);
    }
    const jsonError = formatError(err, env === 'development');
    const level = isClientError(jsonError) ? 'warning' : 'error';
    // Always log all available properties
    logger[level](err.message, serializeError(err));
    res.status(jsonError.status).send({ error: jsonError });
  };
}

export default createErrorMiddleware;
