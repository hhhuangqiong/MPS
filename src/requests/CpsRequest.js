import request from 'superagent-bluebird-promise';
import omitBy from 'lodash/omitBy';
import isUndefined from 'lodash/isUndefined';
import isEmpty from 'lodash/isEmpty';

import validateSchema from '../utils/validateSchema';
import logger from '../utils/logger';

import {
  HttpStatusError,
  URIError,
  ValidationError,
  NotImplementedError,
  NotFoundError,
} from 'common-errors';

export default class CpsRequest {
  constructor(baseUrl = '', timeout = 8000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
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

      logger(`Sending GET Request to ${url}`);

      return request
        .get(url)
        .timeout(this.timeout)
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

      logger(`Sending POST Request to ${url} with params:`, normalizedParams);

      return request
        .post(url)
        .timeout(this.timeout)
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

    if (error.name === 'ValidationError') {
      return Promise.reject(error);
    }

    return Promise.reject(new ValidationError(error.message));
  }
}
