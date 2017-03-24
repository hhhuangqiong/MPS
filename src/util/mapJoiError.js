import { ValidationError } from 'common-errors';

export function mapJoiErrorDetailToValidationError(detail) {
  return new ValidationError(detail.message, detail.type, detail.path);
}

export function mapJoiErrorToValidationError(joiError) {
  const children = joiError.details.map(mapJoiErrorDetailToValidationError);
  const error = new ValidationError(`Validation failed: ${joiError.message}.`);
  error.addErrors(children);
  return error;
}
