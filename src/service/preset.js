import Joi from 'joi';

import Preset from '../models/Preset';
import { ServiceTypes, PaymentModes, Capabilities } from '../models/Provisioning';


export default function presetService(validator) {
  const schemaCreatePreset = Joi.object({
    presetId: Joi.string().required().max(128),
    serviceType: Joi.string().valid(Object.values(ServiceTypes)),
    paymentMode: Joi.string().valid(Object.values(PaymentModes)),
    capabilities: Joi.array().items(Joi.string().valid(Object.values(Capabilities))),
  });

  async function setPreset(command) {
    const sanitizedCommand = validator.sanitize(command, schemaCreatePreset);
    const { presetId } = sanitizedCommand;
    const options = { upsert: true, new: true };

    const preset = await Preset.findOneAndUpdate({ presetId }, sanitizedCommand, options);
    return preset.toJSON();
  }

  const schemaGetPreset = Joi.object({
    presetId: Joi.string().required().max(128),
  });

  async function getPreset(command) {
    const { presetId } = validator.sanitize(command, schemaGetPreset);

    const preset = await Preset.findOne({ presetId });
    return preset.toJSON();
  }

  return {
    setPreset,
    getPreset,
  };
}
