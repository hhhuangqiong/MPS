import { NotFoundError, NotPermittedError } from 'common-errors';

import { check } from './../util';

export function createErrorMiddleware(logger) {
  check.ok('logger', logger);

  // eslint-disable-next-line no-unused-vars
  return function errorMiddleware(err, req, res, next) {
    // TODO: reuse existing logic from common-errors
    // TODO: extract common code
    // https://github.com/shutterstock/node-common-errors/blob/master/lib/middleware/errorHandler.js
    logger.error(err.message, err);

    const joiValidationError = err.data && err.data[0];

    if (joiValidationError) {
      joiValidationError.name = 'ValidationError';

      res.status(422).json({
        error: joiValidationError,
      });

      return;
    }

    if (err instanceof NotPermittedError) {
      res.status(403).json({
        error: {
          message: err.args['0'],
          code: err.name,
          stack: process.env.NODE_ENV === 'production' ? {} : err.stack,
        },
      });

      return;
    }

    if (err instanceof NotFoundError) {
      res.status(404).json({
        error: {
          message: err.message,
          code: err.name,
          stack: process.env.NODE_ENV === 'production' ? {} : err.stack,
        },
      });
      return;
    }


    if (err instanceof Error) {
      res.status(500).json({
        error: {
          message: err.message,
          code: err.name,
          stack: process.env.NODE_ENV === 'production' ? {} : err.stack,
        },
      });

      return;
    }

    if (typeof err === 'string') {
      res.status(400).json({
        error: {
          message: err,
          code: err,
        },
      });

      return;
    }

    res.status(500).json({
      error: {
        code: 'InternalServerError',
        message: 'Internal server error',
      },
    });
  };
}

export default createErrorMiddleware;
