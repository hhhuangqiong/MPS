import Joi from 'joi';
import expressJoiValidator from 'express-joi-validator';

export const SERVICE_PROFILE_SCHEMA = expressJoiValidator({
  params: {
    company_id: Joi.string().required(),
  },
});
