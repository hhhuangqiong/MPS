import Joi from 'joi';
import expressJoiValidator from 'express-joi-validator';

export const START_PROVISIONING_SCHEMA = expressJoiValidator({
  body: {
    company_id: Joi.string().required(),
    company_code: Joi.string().required(),
    company_name: Joi.string().required(),
    country: Joi.string(),
    capabilities: Joi.array(),
    service_type: Joi.string().uppercase().valid('SDK', 'WHITE_LABEL'),
    reseller_carrier_id: Joi.string(),
    payment_mode: Joi.string(),
  },
});

export const GET_PROVISIONING_STATUS_SCHEMA = expressJoiValidator({
  query: {
    company_id: Joi.string().required(),
  },
});

export const GET_PROVISIONING_ALL_STATUS_SCHEMA = expressJoiValidator({
  query: {
    company_id: Joi.any().required(),
  },
});

export const RETRY_PROVISIONING_SCHEMA = expressJoiValidator({
  params: {
    provision_id: Joi.string().required(),
  },
});
