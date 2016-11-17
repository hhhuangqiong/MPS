import _ from 'lodash';
import serializeError from 'serialize-error';
import { ValidationError, HttpStatusError } from 'common-errors';
import mongooseErrors from 'mongoose/lib/error';

import check from './checkArgument';

const UNKNOWN_ERROR_MESSAGE = 'Unknown error occurred.';
const KNOWN_ERROR_PROPERTIES = [
  'message',
  'name',
  'code',
  'status',
  'details',
  'stack',
];

const getMessageFromWeirdError = _.cond([
  [_.isString, e => e],
  [_.isObject, e => e.message || UNKNOWN_ERROR_MESSAGE],
  [() => true, () => UNKNOWN_ERROR_MESSAGE],
]);

function formatAnyError(err) {
  if (!(err instanceof Error)) {
    return {
      message: getMessageFromWeirdError(err),
      name: 'Error',
      status: 500,
    };
  }
  const serialized = serializeError(err);
  if (!serialized.status) {
    const code = HttpStatusError.code_map[err.name];
    serialized.status = _.isNumber(code) ? code : 500;
  }
  return _.pick(serialized, KNOWN_ERROR_PROPERTIES);
}

function formatJoiError(err) {
  return {
    name: err.name,
    message: err.message,
    status: 422,
    details: err.details.map(d => ({
      path: d.path,
      message: d.message,
      code: d.type,
    })),
  };
}

function formatMongooseValidationError(err) {
  return {
    name: err.name,
    message: err.message,
    status: 422,
    details: _(err.errors).map((info, key) => ({
      path: key,
      message: info.message,
      code: info.kind,
    })),
  };
}

function formatValidationError(err) {
  const formatted = _.pick(err, KNOWN_ERROR_PROPERTIES);
  formatted.status = 422;
  formatted.details = err.errors.map(fieldError => ({
    message: fieldError.message,
    path: fieldError.field,
    code: fieldError.code,
  }));
  return formatted;
}

const format = _.cond([
  [err => err.isJoi, formatJoiError],
  [err => err instanceof mongooseErrors.ValidationError, formatMongooseValidationError],
  [err => err instanceof ValidationError, formatValidationError],
  [_.constant(true), formatAnyError],
]);

export function isClientError(err) {
  return err.status && err.status >= 400 && err.status < 500;
}

export function formatError(err, isDevelopment = false) {
  check.ok('err', err);
  const jsonError = format(err);
  if (!isDevelopment) {
    delete jsonError.stack;
  }
  if (!isClientError(jsonError)) {
    jsonError.message = 'Server error occurred.';
  }
  return jsonError;
}

export default formatError;
