import Joi from 'joi';
import { check } from 'm800-util';

import { mapJoiErrorToValidationError } from '../../util/mapJoiError';

// Sanitize will perform validation and conversion (e.g from string to number)
export function sanitize(input, joiSchema, options = { abortEarly: false, stripUnknown: true }) {
  check.ok('joiSchema', joiSchema);

  const { value, error: joiError } = Joi.validate(input, joiSchema, options);
  if (!joiError) {
    return value;
  }
  const error = mapJoiErrorToValidationError(joiError);
  throw error;
}

export default sanitize;
