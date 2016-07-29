import Joi from 'joi';
import getFromPath from 'lodash/get';
import { ValidationError } from 'common-errors';

export default function validateSchema(params = {}, rules = {}) {
  const result = Joi.validate(params, rules);

  // Always return the first error object
  const error = getFromPath(result, 'error.details[0]');

  if (!error) {
    return null;
  }

  // Transform object format error info into an error instance
  return new ValidationError(error.message, error.type, error.path);
}
