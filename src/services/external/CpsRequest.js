import _ from 'lodash';
import BaseRequest from './BaseRequest';

import {
  HttpStatusError,
  NotFoundError,
  ValidationError,
} from 'common-errors';

const ERROR_NAME = {
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  USER_CARRIER_PROFILE_ALREADY_EXISTS: 'USER_CARRIER_PROFILE_ALREADY_EXISTS',
  CARRIER_PROFILE_ALREADY_EXISTS: 'CARRIER_PROFILE_ALREADY_EXISTS',
  CARRIER_ALREADY_EXISTS: 'CARRIER_ALREADY_EXISTS',
};

const ERROR_CODE_TO_NAME = {
  34000: ERROR_NAME.INVALID_PARAMETER,
  30000: ERROR_NAME.INTERNAL_SERVER_ERROR,
  50103: ERROR_NAME.USER_CARRIER_PROFILE_ALREADY_EXISTS,
  50102: ERROR_NAME.CARRIER_PROFILE_ALREADY_EXISTS,
  50101: ERROR_NAME.CARRIER_ALREADY_EXISTS,
};

export class CpsRequest extends BaseRequest {
  constructor(logger, options) {
    super(logger, options);
    this.errorNames = ERROR_NAME;
  }

  get(uri) {
    return super.get(uri)
      .catch(e => this.handleError(e));
  }

  post(uri, params) {
    return super.post(uri, params)
      .catch(e => this.handleError(e));
  }

  handleError(error) {
    const parsedError = this.parseError(error);
    if (parsedError) {
      throw this.mapError(parsedError);
    }
  }
  parseError(superagentError) {
    let parsedError = _.get(superagentError, 'body.error');
    if (parsedError) {
      return parsedError;
    }
    try {
      parsedError = JSON.parse(superagentError.res.text).error;
    } catch (e) {
      this.logger.warning('Unexpected response from CPS: ', superagentError);
      throw new ReferenceError(`Unexpected response from CPS ${superagentError.res.text}`);
    }
    return parsedError;
  }
}

CpsRequest.prototype.mapError = _.cond([
  [e => e.status === 400, e => new ValidationError(e.message, ERROR_CODE_TO_NAME[e.code] || e.code.toString())],
  [e => e.status === 404, e => {
    const error = new NotFoundError(e.message);
    error.message = e.message;
    return error;
  }],
  [_.constant(true), e => {
    const error = new HttpStatusError(e.status, e.message);
    error.code = e.code;
    return error;
  }],
]);

export default CpsRequest;
