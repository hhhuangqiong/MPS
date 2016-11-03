import Joi from 'joi';

const PUBLIC_ERROR_SCHEMA = Joi.object({
  message: Joi.string().required(),
  name: Joi.string().default('SystemError').required(),
  traceId: Joi.string(),
  eventName: Joi.string(),
}).options({ allowUnknown: true });

export const PUBLIC_STATE_SCHEMA = Joi.object({
  results: Joi.object({
    adminRoleCreated: Joi.boolean(),
    developerId: Joi.string().allow(null),
    bossProvisionId: Joi.string().allow(null),
    carrierId: Joi.string().allow(null),
    carrierProfileId: Joi.string().allow(null),
    certificates: Joi.array(Joi.object({
      templateId: Joi.string().required(),
      certificateId: Joi.string().required(),
    })),
    certificatesCreated: Joi.boolean(),
    companyId: Joi.string().allow(null),
    capabilities: Joi.array().items(Joi.string()),
    featureSetId: Joi.string().allow(null),
    featureSetIdentifier: Joi.string().allow(null),
    smsProfileId: Joi.string().allow(null),
    signUpRuleIds: Joi.array().items(Joi.string()),
    notifications: Joi.array().items(Joi.string()),
    notificationsCreated: Joi.boolean(),
    applicationIdentifier: Joi.string().allow(null),
    applications: Joi.array(Joi.object({
      app: Joi.object().required(),
      platform: Joi.string().required(),
    })),
    sipGateways: Joi.array(Joi.string()),
    sipRoutingProfileId: Joi.string().allow(null),
    userCarrierProfileId: Joi.string().allow(null),
    verificationProfileId: Joi.string().allow(null),
    voiceProfileId: Joi.string().allow(null),
  }).options({ presence: 'required' }),
  errors: Joi.array().items(PUBLIC_ERROR_SCHEMA),
});

export const DEFAULT_PUBLIC_STATE = {
  adminRoleCreated: false,
  developerId: null,
  bossProvisionId: null,
  carrierId: null,
  carrierProfileId: null,
  certificates: [],
  certificatesCreated: false,
  companyId: null,
  capabilities: [],
  featureSetId: null,
  featureSetIdentifier: null,
  smsProfileId: null,
  signUpRuleIds: [],
  notifications: [],
  notificationsCreated: false,
  applicationIdentifier: null,
  applications: [],
  sipGateways: [],
  sipRoutingProfileId: null,
  userCarrierProfileId: null,
  verificationProfileId: null,
  voiceProfileId: null,
};
