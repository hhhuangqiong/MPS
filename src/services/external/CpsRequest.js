import isEmpty from 'lodash/isEmpty';
import BaseRequest from './BaseRequest';

import {
  HttpStatusError,
  NotImplementedError,
  NotFoundError,
} from 'common-errors';

export class CpsRequest extends BaseRequest {
  get(uri) {
    return super.get(uri)
      .catch(e => this.handleError(e));
  }

  post(uri, params) {
    return super.post(uri, params)
      .catch(e => this.handleError(e));
  }

  handleError(error) {
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
      this.logger.warning('Unexpected response from CPS: ', error);
      throw new ReferenceError(`Unexpected response from CPS ${error.res}`);
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

export default CpsRequest;
