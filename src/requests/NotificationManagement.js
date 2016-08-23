import Joi from 'joi';
import CpsRequest from './CpsRequest';


const ApplicationMesssageSchema = Joi.object({
  message_body: Joi.string().allow(''),
  message_attributes: Joi.object(),
  rich_message: Joi.boolean(),
});

const PushMessageSchema = Joi.object({
  message_body: Joi.string().allow(''),
  message_attributes: Joi.object(),
  platform_specific_attributes: Joi.array().items(Joi.object({
    platform: Joi.string().required(),
    attribute_name: Joi.string().required(),
    attribute_value: Joi.string().required(),
  })),
});

const NotificationCreationSchema = Joi.object({
  carrier: Joi.string().required(),
  name: Joi.string().allow(''),
  description: Joi.string().allow(''),
  identifier: Joi.string().required(),
  application_messages: Joi.object().pattern(/.*/, ApplicationMesssageSchema),
  pushed_messages: Joi.object().pattern(/.*/, PushMessageSchema),
});


export default class NotificationManagement extends CpsRequest {
  getTemplates(params) {
    const uri = '/1.0/notifications/templates';

    const schema = Joi.object({
      group: Joi.string().required(),
    });

    const validationError = this.validateParams(params, schema);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.get(`${uri}?group=${params.group}`);
  }

  save(params) {
    const uri = '/1.0/notifications';
    const validationError = this.validateParams(params, NotificationCreationSchema);

    if (validationError) {
      return this.validationErrorHandler(validationError);
    }

    return this.post(uri, params);
  }

}
