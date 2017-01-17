import Promise from 'bluebird';
import request from 'superagent-bluebird-promise';
import saLogger from 'superagent-logger';
import { ValidationError } from 'common-errors';
import _ from 'lodash';

import validateSchema from './validateSchema';

let proxyInitialized = false;

export default class BaseRequest {
  constructor(logger, { baseUrl, timeout, proxyUrl }) {
    this.logger = logger;
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.proxyUrl = proxyUrl;
    if (proxyUrl && !proxyInitialized) {
      // eslint-disable-next-line
      require('superagent-proxy')(request);
      proxyInitialized = true;
    }
  }

  normalizeParams(params) {
    if (!_.isPlainObject(params)) {
      return params;
    }
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
    this.logger.debug(`[${(new Date()).toUTCString()}] Sending GET Request to ${url}`);
    let req = request.get(url);
    if (this.proxyUrl) {
      req = req.proxy(this.proxyUrl);
    }
    return req
      .timeout(this.timeout)
      .use(saLogger({ outgoing: true, timestamp: true }))
      .set('Accept', 'application/json')
      .promise();
  }

  post(uri, params) {
    const url = this.getUrl(uri);
    const normalizedParams = this.normalizeParams(params);
    this.logger.debug(
      `[${(new Date()).toUTCString()}] Sending POST Request to ${url} with params:`,
      normalizedParams
    );
    let req = request.post(url);
    if (this.proxyUrl) {
      req = req.proxy(this.proxyUrl);
    }
    return req
      .timeout(this.timeout)
      .use(saLogger({ outgoing: true, timestamp: true }))
      .set('Accept', 'application/json')
      .send(normalizedParams)
      .promise();
  }

  postFile(uri, fieldName, file) {
    const url = this.getUrl(uri);
    let req = request.post(url);
    if (this.proxyUrl) {
      req = req.proxy(this.proxyUrl);
    }
    return req
      .timeout(this.timeout)
      .use(saLogger({ outgoing: true, timestamp: true }))
      .set('Content-Type', 'multipart/form-data')
      .attach(fieldName, file.buffer, file.originalname)
      .promise();
  }
}
