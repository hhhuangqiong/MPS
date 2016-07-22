import request from 'superagent-bluebird-promise';
import omitBy from 'lodash/omitBy';
import isUndefined from 'lodash/isUndefined';
import validateSchema from '../utils/validateSchema';

export default class CpsRequest {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  getUrl(uri = '') {
    if (typeof uri !== 'string') {
      throw new Error('uri is not a string');
    }

    if (!uri.length) {
      throw new Error('uri is empty');
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

  post(uri, params) {
    const url = this.getUrl(uri);
    const normalizedParams = this.normalizeParams(params);

    return request
      .post(url)
      .send(normalizedParams)
      .set('Accept', 'application/json')
      .promise();
  }
}
