// @TODO move to m800-util
import * as _ from 'lodash';
import Joi from 'joi';
import { ValidationError } from 'common-errors';
import { check } from 'm800-util';

function joiErrorToValidationError(joiError) {
  return new ValidationError(joiError.message, joiError.type, joiError.path);
}

function extractMessage(err) {
  const DEFAULT_MESSAGE = '[Empty message]';
  if (_.isString(err)) {
    return err || DEFAULT_MESSAGE;
  }
  return err.message || DEFAULT_MESSAGE;
}

function toJoiLikeError(err) {
  if (_.isString(err)) {
    return {
      message: extractMessage(err),
      path: '$',
      type: 'any.custom',
    };
  }
  return _.defaults(err, {
    message: extractMessage(err),
    path: '$',
    type: 'any.custom',
  });
}

// sanitize will perform validation and conversion (e.g from string to number)
function sanitize(input, joiSchema, options = { abortEarly: false }) {
  check.ok('joiSchema', joiSchema);

  const { value, error } = Joi.validate(input, joiSchema, options);
  if (!error) {
    return value;
  }
  const message = `Validation failed: ${error.message}`;
  const validationError = new ValidationError(message);
  const children = error.details.map(joiErrorToValidationError);
  validationError.addErrors(children);
  throw validationError;
}

function verify(obj, verifier) {
  const result = verifier(obj);
  if (!_.isEmpty(result)) {
    const children = (_.isArray(result) ? result : [result])
      .map(toJoiLikeError)
      .map(joiErrorToValidationError);
    const detail = children.length === 1 ? children[0].message : 'multiple invalid fields';
    const message = `Validation failed: ${detail}`;
    const error = new ValidationError(message);
    error.addErrors(children);
    throw error;
  }
  return obj;
}

export const validator = {
  sanitize,
  verify,
};

export default validator;
