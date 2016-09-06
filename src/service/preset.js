import Joi from 'joi';
import { NotFoundError } from 'common-errors';
import Preset from '../models/Preset';
import { ServiceTypes, PaymentModes, Capabilities } from '../models/Provisioning';


export default function presetService(validator) {
  const schemaCreatePreset = Joi.object({
    presetId: Joi.string().required().max(128),
    serviceType: Joi.string().valid(Object.values(ServiceTypes)),
    paymentMode: Joi.string().valid(Object.values(PaymentModes)),
    capabilities: Joi.array().items(Joi.string().valid(Object.values(Capabilities))),
    billing: Joi.object({
      smsPackageId: Joi.number().min(0),
      offnetPackageId: Joi.number().min(0),
      currency: Joi.number().min(0),
    }).required(),
    smsc: Joi.object({
      needBilling: Joi.boolean(),
      defaultRealm: Joi.string(),
      servicePlanId: Joi.string(),
      sourceAddress: Joi.string(),
    }).required(),
  });

  async function setPreset(command) {
    const sanitizedCommand = validator.sanitize(command, schemaCreatePreset);
    const { presetId } = sanitizedCommand;
    const options = { upsert: true, new: true };

    const preset = await Preset.findOneAndUpdate({ presetId }, sanitizedCommand, options);
    return preset;
  }

  const schemaGetPreset = Joi.object({
    presetId: Joi.string().required().max(128),
  });

  async function getPreset(command) {
    const { presetId } = validator.sanitize(command, schemaGetPreset);

    const preset = await Preset.findOne({ presetId });
    if (!preset) {
      throw new NotFoundError('Preset');
    }

    return preset;
  }

  return {
    setPreset,
    getPreset,
  };
}
