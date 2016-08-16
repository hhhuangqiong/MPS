import { NotFoundError, NotPermittedError } from 'common-errors';
// Disable for the unused next params,
// which is neccessary to exist for error handling identification
/* eslint-disable no-unused-vars */
export default function errorMiddleware(err, req, res, next) {
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
        name: err,
      },
    });

    return;
  }

  res.status(500).json({
    error: {
      message: 'Undefined error format',
    },
  });
}
