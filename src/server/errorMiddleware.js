// Disable for the unused next params,
// which is neccessary to exist for error handling identification
/* eslint-disable no-unused-vars */
export default function errorMiddleware(err, req, res, next) {
    res
    .status(err.status || 500)
    .json({
      message: err.message,
      error: process.env.NODE_ENV !== 'production' ? err.stack : {},
    });
}
