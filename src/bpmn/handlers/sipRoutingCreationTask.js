import { ArgumentNullError } from 'common-errors';
import escapeStringRegexp from 'escape-string-regexp';

import { check } from './../../util';
import { compileJsonTemplate } from './common';
import { SIP_ROUTING_CREATION } from './bpmnEvents';

export function createSipRoutingCreationTask(cpsOptions, voiceProvisioningManagement) {
  check.ok('cpsOptions', cpsOptions);
  check.ok('voiceProvisioningManagement', voiceProvisioningManagement);

  const { sip } = cpsOptions;
  const template = sip.routing.template;

  async function createSipRouting(state, profile, context) {
    if (state.results.sipRoutingProfileId) {
      return null;
    }
    const { logger } = context;
    const { carrierId, sipGateways } = state.results;
    if (!carrierId) {
      throw new ArgumentNullError('carrierId');
    }
    const escapedCarrierId = escapeStringRegexp(carrierId);
    const templateParams = {
      sipGateways,
      carrierId,
      escapedCarrierId,
    };
    const query = compileJsonTemplate(template, templateParams);
    const res = await voiceProvisioningManagement.sipRoutingProfileCreation(query);
    const sipRoutingProfileId = res.body.id;
    logger.info(`sip routing profile ${sipRoutingProfileId} creation complete`);

    if (!sipRoutingProfileId) {
      throw new ReferenceError('Invalid response from cps sip routing profile creation: id is missing');
    }
    return {
      results: {
        sipRoutingProfileId,
      },
    };
  }

  createSipRouting.$meta = {
    name: SIP_ROUTING_CREATION,
  };

  return createSipRouting;
}

export default createSipRoutingCreationTask;
