import Joi from 'joi';
import _ from 'lodash';
import { HttpStatusError, InvalidOperationError, Error } from 'common-errors';

import BaseRequest from './BaseRequest';

const ApplicationVersionStatus = {
  RELEASED: 'RELEASED',
  UNRELEASED: 'UNRELEASED',
};

const IdentityTypes = {
  PHONE_NUMBER: 'PHONE_NUMBER',
};

const PolicyTypes = {
  ALLOW: 'ALLOW',
  BLOCK: 'BLOCK',
};

const SignUpRuleCreationSchema = Joi.object({
  carrierId: Joi.string().required(),
  rules: Joi.array().items(Joi.object({
    applicationVersionStatus: Joi.string().required().valid(_.values(ApplicationVersionStatus)),
    group: Joi.string().required(),
    identityType: Joi.string().required().valid(_.values(IdentityTypes)),
    identity: Joi.string().required(),
    regex: Joi.boolean().required().default(false),
    policy: Joi.string().required().valid(_.values(PolicyTypes)),
    order: Joi.number().required(),
    updatedUser: Joi.string().required(),
    comments: Joi.string().required(),
  })),
});

export class SignUpRuleMgmt extends BaseRequest {

  static ApplicationVersionStatus = ApplicationVersionStatus;
  static IdentityTypes = IdentityTypes;
  static PolicyTypes = PolicyTypes;

  create(params) {
    const validationError = this.validateParams(params, SignUpRuleCreationSchema);
    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    const { rules, carrierId } = params;

    return this.post(`/2.0/carriers/${carrierId}/signupRules`, rules)
      .catch(this.errorHandler);
  }

  errorHandler(error) {
    const isHttpStatusError = !_.isEmpty(error.body);

    if (isHttpStatusError) {
      const parsedError = new HttpStatusError(error.status, `${error.body.id} - ${error.body.error}`);
      throw parsedError;
    }

    let responseError;
    try {
      responseError = JSON.parse(error.res.text).error;
    } catch (e) {
      const message = _.get(error, 'res.text', 'Empty response body');
      throw new ReferenceError(`Unexpected response from Sign Up Rule Service: ${message}`, e);
    }

    let parsedError;
    switch (responseError.code) {
      case 10001:
        parsedError = new InvalidOperationError(responseError.message);
        break;
      default:
        parsedError = new Error(responseError.message);
    }
    parsedError.code = responseError.code;

    throw parsedError;
  }
}

export default SignUpRuleMgmt;
