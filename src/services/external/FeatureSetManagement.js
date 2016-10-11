import Joi from 'joi';
import isEmpty from 'lodash/isEmpty';
import { ArgumentNullError } from 'common-errors';

import CpsRequest from './CpsRequest';

export class FeatureSetManagement extends CpsRequest {

  getFeatureSetTemplate(group = '') {
    const uri = '/1.0/feature_sets/templates';

    if (isEmpty(group)) {
      return this.validationErrorHandler(new ArgumentNullError('group'));
    }

    return this.get(`${uri}?group=${group}`);
  }

  createFeatureSet(params) {
    const uri = '/1.0/feature_sets';
    const validationError = this.validateParams(params, {
      identifier: Joi.string().required(),
      features: Joi.array().required(),
    });

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri, params);
  }
}

export default FeatureSetManagement;
