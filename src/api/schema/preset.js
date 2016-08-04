import Joi from 'joi';
import expressJoiValidator from 'express-joi-validator';

export const GET_PROVISION_PRESET = expressJoiValidator({
  params: {
    preset_id: Joi.string().required(),
  },
});

export const CREATE_PROVISION_PRESET = expressJoiValidator({
  params: {
    preset_id: Joi.string().required(),
  },
  body: {
    capabilities: Joi.array(),
    service_type: Joi.string(),
    payment_mode: Joi.string(),
  },
});

export const UPDATE_PROVISION_PRESET = expressJoiValidator({
  params: {
    preset_id: Joi.string().required(),
  },
  body: {
    capabilities: Joi.array(),
    service_type: Joi.string(),
    payment_mode: Joi.string(),
  },
});
