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

  if (err instanceof Error) {
    res.status(400).json({
      error: {
        message: err.message,
        name: err.name,
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
