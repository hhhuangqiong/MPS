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

  get(uri) {
    const url = this.getUrl(uri);

    return new Promise((resolve, reject) => {
      request
        .get(url)
        .set('Accept', 'application/json')
        .end((responseError, response) => {
          if (response.body.error) {
            reject(response.body.error);
            return;
          }

          resolve(response);
        });
    });
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
