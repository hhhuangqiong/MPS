import Joi from 'joi';

export const getProvisioningStatusSchema = {
  query: {
    company_id: Joi.string().required(),
  },
};

export const getProvisioningAllStatusSchema = {
  query: {
    company_id: Joi.any().required(),
  },
};

export const serviceProfileSchema = {
  params: {
    company_id: Joi.string().required(),
  },
};

export const retryProvisioningSchema = {
  params: {
    provision_id: Joi.string().required(),
  },
};

export const startProvisioningSchema = {
  body: {
    company_id: Joi.string().required(),
    company_code: Joi.string().required(),
    company_name: Joi.string().required(),
    capabilities: Joi.array(),
    service_type: Joi.string().uppercase().valid('SDK', 'WHITE_LABEL'),
    reseller_carrier_id: Joi.string(),
    payment_mode: Joi.string(),
  },
};
