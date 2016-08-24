import _ from 'lodash';
import isEmpty from 'lodash/isEmpty';
import BaseRequest from './BaseRequest';

import {
  HttpStatusError,
  NotImplementedError,
  NotFoundError,
} from 'common-errors';

export default class CpsRequest extends BaseRequest {
  get(uri) {
    return super.get(uri)
      .catch(this.errorHandler);
  }

  post(uri, params) {
    return super.post(uri, params)
      .catch(this.errorHandler);
  }

  errorHandler(error) {
    const isHttpStatusError = !isEmpty(error.body);

    if (isHttpStatusError) {
      const parsedError = new HttpStatusError(error.status, error.body.error.message);
      parsedError.code = error.body.error.code;

      throw parsedError;
    }

    let responseError;
    try {
      responseError = JSON.parse(error.res.text).error;
    } catch (e) {
      throw new ReferenceError('Unexpected response from CPS: ', _.get(error, 'res', null), e);
    }

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
}
