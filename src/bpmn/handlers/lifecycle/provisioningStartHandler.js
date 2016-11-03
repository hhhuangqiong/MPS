import _ from 'lodash';
import Joi from 'joi';

import { check } from './../../../util';
import { PROVISIONING_START } from '../bpmnEvents';
import { createStore, DEFAULT_PUBLIC_STATE } from './../common';

export function createProvisioningStartHandler() {
  function startProvisioning(input) {
    check.schema('input', input, Joi.object({
      processId: Joi.string().required(),
      provisioningId: Joi.string().required(),
      profile: Joi.object().required(),
      previousResults: Joi.object().allow(null).optional(),
    }));

    const store = createStore(this);
    const state = store.get() || {};

    const results = _.defaults({}, input.previousResults, DEFAULT_PUBLIC_STATE);

    _.assign(state, {
      public: {
        results,
        errors: [],
      },
      system: {
        errors: [],
        processId: input.processId,
        provisioningId: input.provisioningId,
      },
    });

    store.set(state);

    return input.profile;
  }

  startProvisioning.$meta = {
    name: PROVISIONING_START,
  };

  return startProvisioning;
}

export default createProvisioningStartHandler;
