import * as _ from 'lodash';
import Joi from 'joi';
import { ArgumentError } from 'common-errors';


function ensureArgumentName(argumentName) {
  if (!_.isString(argumentName)) {
    const err = new ArgumentError();
    err.message = 'Invalid assertion: argument name should be a string.';
    throw err;
  }
}

function ok(argumentName, obj, message) {
  ensureArgumentName(argumentName);
  if (obj) {
    return obj;
  }
  const error = new ArgumentError(argumentName);
  if (_.isString(message) && message.length > 0) {
    error.message = message;
  }
  throw error;
}

function schema(argumentName, obj, joiSchema, message) {
  ensureArgumentName(argumentName);
  const result = Joi.validate(obj, joiSchema, {
    abortEarly: false,
  });
  if (!result.error) {
    return result.value;
  }
  const error = new ArgumentError(argumentName);
  const messages = [error.message];
  if (_.isString(message) && message.length > 0) {
    messages.push(message);
  }
  messages.push(result.error.annotate());
  error.message = messages.join('\n');
  throw error;
}

function predicate(argumentName, obj, func, message) {
  ensureArgumentName(argumentName);
  const test = _.isArray(func)
    ? (x) => _.every(func, f => f(x))
    : func;
  if (test(obj)) {
    return obj;
  }
  const error = new ArgumentError(argumentName);
  if (_.isString(message) && message.length > 0) {
    error.message = message;
  }
  throw error;
}

function members(argumentName, obj, requiredKeys) {
  ensureArgumentName(argumentName);
  schema('requiredKeys', requiredKeys, Joi.array().items(Joi.string()).min(1));
  const existingKeys = _.chain(obj)
    .omit(_.isUndefined)
    .omit(_.isNull)
    .keys()
    .value();
  const diff = _.difference(requiredKeys, existingKeys);
  if (diff.length === 0) {
    return obj;
  }
  const message = `Required object keys missing: ${diff.join(', ')}`;
  const error = new ArgumentError(argumentName);
  error.message = [error.message, message].join(' ');
  throw error;
}

export const checkArgument = {
  ok,
  schema,
  predicate,
  members,
};

export default checkArgument;
