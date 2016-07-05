import Joi from 'joi';
import getFromPath from 'lodash/get';

export default function validateSchema(params = {}, rules = {}) {
  const result = Joi.validate(params, rules);

  // Always return the first error object
  return getFromPath(result, 'error.details[0]');
}
