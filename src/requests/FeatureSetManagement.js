import Joi from 'joi';
import isEmpty from 'lodash/isEmpty';
import { ArgumentNullError } from 'common-errors';

import CpsRequest from './CpsRequest';

export default class FeatureSetManagement extends CpsRequest {
  constructor(baseUrl = '') {
    super(baseUrl);
  }

  getFeatureSetTemplate(group = '') {
    const uri = '/1.0/feature_sets/templates';

    if (isEmpty(group)) {
      return this.validationErrorHandler(new ArgumentNullError('group'));
    }

    return this.get(`${uri}?group=${group}`);
  }

  createFeatureSet({
    features = [],
    ...restParams,
  }) {
    const uri = '/1.0/feature_sets';

    const params = {
      ...restParams,
      features,
    };

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
