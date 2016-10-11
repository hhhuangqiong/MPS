import Joi from 'joi';
import { NotFoundError } from 'common-errors';

import {
  ServiceTypes,
  PaymentModes,
  ChargeWallets,
  Capabilities,
} from './../domain';
import { validator, check } from './util';

export function presetService(Preset) {
  check.ok('Preset', Preset);

  const SET_PRESET_SCHEMA = Joi.object({
    presetId: Joi.string().required().max(128),
    serviceType: Joi.string().valid(ServiceTypes),
    paymentMode: Joi.string().valid(PaymentModes),
    chargeWallet: Joi.string().valid(ChargeWallets),
    capabilities: Joi.array().items(Joi.string().valid(Capabilities)),
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
    const sanitizedCommand = validator.sanitize(command, SET_PRESET_SCHEMA);
    const { presetId } = sanitizedCommand;
    const options = { upsert: true, new: true };
    const preset = await Preset.findOneAndUpdate({ presetId }, sanitizedCommand, options);
    return preset;
  }

  const GET_PRESET_SCHEMA = Joi.object({
    presetId: Joi.string().required().max(128),
  });

  async function getPreset(command) {
    const { presetId } = validator.sanitize(command, GET_PRESET_SCHEMA);
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

export default presetService;
