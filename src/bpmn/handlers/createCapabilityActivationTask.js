import Joi from 'joi';
import _ from 'lodash';
import { check } from './../../util';
import { Capabilities, CapabilityTypes } from './../../domain';

export function createCapabilityActivationTask(capabilitiesManagement, requiredCapabilities) {
  check.ok('capabilitiesManagement', capabilitiesManagement);
  requiredCapabilities = check.schema('requiredCapabilities', requiredCapabilities, Joi.object({
    internal: Joi.array()
      .items(Joi.string().allow(Capabilities))
      .single()
      .required(),
    external: Joi.string().allow(CapabilityTypes).required(),
  }));

  async function activateCapability(state, profile) {
    const { capabilities, carrierId } = state.results;
    const alreadyActivated = _.difference(requiredCapabilities.internal, capabilities).length === 0;
    if (alreadyActivated) {
      return null;
    }
    const shouldBeActivated = _.intersection(profile.capabilities, requiredCapabilities.internal).length !== 0;
    if (!shouldBeActivated) {
      return null;
    }
    await capabilitiesManagement.enableCapabilityByType(requiredCapabilities.external, { carrierId });

    return {
      results: {
        capabilities: _.uniq(capabilities.concat(requiredCapabilities.internal)),
      },
    };
  }

  return activateCapability;
}

export default createCapabilityActivationTask;
