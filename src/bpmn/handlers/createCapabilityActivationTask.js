import Joi from 'joi';
import _ from 'lodash';
import { check } from './../../util';
import { Capabilities, CapabilityTypes } from './../../domain';

export function createCapabilityActivationTask(capabilitiesManagement, capabilityOptions) {
  check.ok('capabilitiesManagement', capabilitiesManagement);
  capabilityOptions = check.schema('capabilityOptions', capabilityOptions, Joi.object({
    requirements: Joi.array()
      .items(Joi.string().allow(Capabilities))
      .single()
      .required(),
    internal: Joi.string().allow(Capabilities).required(),
    external: Joi.string().allow(CapabilityTypes).required(),
  }));

  async function activateCapability(state, profile) {
    const { capabilities, carrierId } = state.results;
    // Should activate only if at least one from requirements is mentioned in profile
    const shouldBeActivated = _.intersection(profile.capabilities, capabilityOptions.requirements).length !== 0;
    if (!shouldBeActivated) {
      return null;
    }
    const alreadyActivated = _.includes(capabilities, capabilityOptions.internal);
    if (alreadyActivated) {
      return null;
    }
    await capabilitiesManagement.enableCapabilityByType(capabilityOptions.external, { carrierId });

    return {
      results: {
        capabilities: capabilities.concat([capabilityOptions.internal]),
      },
    };
  }

  return activateCapability;
}

export default createCapabilityActivationTask;
