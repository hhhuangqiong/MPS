import Promise from 'bluebird';
import request from 'superagent-bluebird-promise';
import Throttle from 'superagent-throttle';
import { ValidationError } from 'common-errors';
import _ from 'lodash';

import logger from '../utils/logger';
import validateSchema from '../utils/validateSchema';


export default class BaseRequest {
  constructor({
    baseUrl,
    timeout,
    throttle = {},
  }) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;

    const {
      active = true,
      rate = 5,
      ratePer = 10000,
      concurrent = 20,
     } = throttle;

    this.throttle = new Throttle({
      active,     // set false to pause queue
      rate,          // how many requests can be sent every `ratePer`
      ratePer,   // number of ms in which `rate` requests may be sent
      concurrent,     // how many requests can be sent concurrently
    });
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

    logger(`[${(new Date()).toUTCString()}] Sending GET Request to ${url}`);

    return request
      .get(url)
      .timeout(this.timeout)
      .set('Accept', 'application/json')
      .use(this.throttle.plugin())
      .promise();
  }

  post(uri, params) {
    const url = this.getUrl(uri);
    const normalizedParams = this.normalizeParams(params);

    logger(`[${(new Date()).toUTCString()}] Sending POST Request to ${url} with params:`, normalizedParams);

    return request
      .post(url)
      .timeout(this.timeout)
      .use(this.throttle.plugin())
      .set('Accept', 'application/json')
      .send(normalizedParams)
      .promise();
  }
}
