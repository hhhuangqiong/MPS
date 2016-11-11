import Joi from 'joi';
import CpsRequest from './CpsRequest';

const SMSServicePlanSchema = Joi.object({
  identifier: Joi.string().required(),
  description: Joi.string(),
});

export class SmsServicePlanManagement extends CpsRequest {
  create(params) {
    const uri = '/1.0/sms/service_plans';
    const validationError = this.validateParams(params, SMSServicePlanSchema);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri, params);
  }
}

export default SmsServicePlanManagement;
