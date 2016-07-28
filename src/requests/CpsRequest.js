import request from 'superagent-bluebird-promise';
import omitBy from 'lodash/omitBy';
import isUndefined from 'lodash/isUndefined';
import isEmpty from 'lodash/isEmpty';
import validateSchema from '../utils/validateSchema';

import {
  HttpStatusError,
  URIError,
  ValidationError,
  NotImplementedError,
  NotFoundError,
} from 'common-errors';

export default class CpsRequest {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  getUrl(uri = '') {
    if (typeof uri !== 'string') {
      throw new URIError('uri is not a string');
    }

    if (!uri.length) {
      throw new URIError('uri is empty');
    }

    return `${this.baseUrl}${uri}`;
  }

  normalizeParams(params) {
    return omitBy(params, isUndefined);
  }

  validateParams(params = {}, rules = {}) {
    // Extend using validateSchema util function in case having custom logic here
    return validateSchema(params, rules);
  }

  get(uri) {
    try {
      const url = this.getUrl(uri);

      return request
        .get(url)
        .set('Accept', 'application/json')
        .promise()
        .catch(this.errorHandler);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  post(uri, params) {
    try {
      const url = this.getUrl(uri);
      const normalizedParams = this.normalizeParams(params);

      return request
        .post(url)
        .send(normalizedParams)
        .set('Accept', 'application/json')
        .promise()
        .catch(this.errorHandler);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  errorHandler(error) {
    const isHttpStatusError = !isEmpty(error.body);

    if (isHttpStatusError) {
      const parsedError = new HttpStatusError(error.status, error.body.error.message);
      parsedError.code = error.body.error.code;

      throw parsedError;
    }

    const responseError = JSON.parse(error.res.text).error;

    let parsedError;

    switch (responseError.code) {
      case 21000:
        parsedError = new NotFoundError(responseError.message);
        break;

      default:
        parsedError = new NotImplementedError(responseError.message);
    }

    parsedError.code = responseError.code;
    parsedError.status = responseError.status;

    throw parsedError;
  }

  validationErrorHandler(error) {
    if (error.name === 'ArgumentNullError') {
      return Promise.reject(new ValidationError(error.message, null, error.argumentName));
    }

    const parsedError = new ValidationError(error.message, error.type, error.path);
    parsedError.context = error.context;

    return Promise.reject(parsedError);
  }
}
