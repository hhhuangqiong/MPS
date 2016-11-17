import Joi from 'joi';
import CpsRequest from './CpsRequest';

const SMSRealmSchema = Joi.object({
  identifier: Joi.string().required(),
  connection_strategy: Joi.object({
    type: Joi.string().required(),
    system_id: Joi.string().required(),
    password: Joi.string().required(),
    bindings_per_smsc: Joi.number(),
    binding_details: Joi.array().items(Joi.object({
      ip: Joi.string().required(),
      port: Joi.number().required(),
    })),
  }).required(),
});

export class SmsRealmManagement extends CpsRequest {
  create(params) {
    const uri = '/1.0/sms/realms';
    const validationError = this.validateParams(params, SMSRealmSchema);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri, params);
  }
}

export default SmsRealmManagement;
