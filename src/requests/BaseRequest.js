import Promise from 'bluebird';
import request from 'superagent-bluebird-promise';
import saLogger from 'superagent-logger';
import { ValidationError } from 'common-errors';
import _ from 'lodash';

import logger from '../utils/logger';
import validateSchema from '../utils/validateSchema';


export default class BaseRequest {
  constructor({ baseUrl, timeout }) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  normalizeParams(params) {
    return _.omitBy(params, _.isUndefined);
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

  validateParams(params = {}, rules = {}) {
    // Extend using validateSchema util function in case having custom logic here
    return validateSchema(params, rules);
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

  get(uri) {
    const url = this.getUrl(uri);

    logger.debug(`[${(new Date()).toUTCString()}] Sending GET Request to ${url}`);

    return request
      .get(url)
      .timeout(this.timeout)
      .use(saLogger({ outgoing: true, timestamp: true }))
      .set('Accept', 'application/json')
      .promise();
  }

  post(uri, params) {
    const url = this.getUrl(uri);
    const normalizedParams = this.normalizeParams(params);

    logger.debug(`[${(new Date()).toUTCString()}] Sending POST Request to ${url} with params:`, normalizedParams);

    return request
      .post(url)
      .timeout(this.timeout)
      .use(saLogger({ outgoing: true, timestamp: true }))
      .set('Accept', 'application/json')
      .send(normalizedParams)
      .promise();
  }
}
