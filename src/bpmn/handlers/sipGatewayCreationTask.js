import { ReferenceError } from 'common-errors';
import _ from 'lodash';

import { check } from './../../util';
import { SIP_GATEWAY_CREATION } from './bpmnEvents';
import { compileJsonTemplate, IncompleteResultError } from './common';

export function createSipGatewayCreationTask(cpsOptions, voiceProvisioningManagement) {
  check.ok('cpsOptions', cpsOptions);
  check.ok('voiceProvisioningManagement', voiceProvisioningManagement);

  async function createSipGateway(state, profile, context) {
    const { logger } = context;
    const { sipGateways, carrierId } = state.results;
    const { sip } = cpsOptions;
    // A template is a composite of 2 parts
    // 1. profile - different for each gateway
    // 2. manipulation_rules - same for all provisioned gateways
    // All gateway profiles should be provisioned with same manipulation_rules
    const { profiles, manipulation_rules } = sip.gateway.template;
    const profilesToGenerate = profiles.length;

    if (_.keys(sipGateways).length >= profilesToGenerate) {
      logger.info(`Skip on rerun as all sip gateways generated: profilesToGenerate=${profilesToGenerate}`);
      return null;
    }
    const start = _.keys(sipGateways).length;
    logger.info(`Creating ${profilesToGenerate} sip gateways for ${carrierId} starting from ${start}`);
    let currentSipGateways = sipGateways;
    let error = null;

    try {
      for (let i = start; i < profilesToGenerate; i++) {
        const sipProfile = profiles[i];
        const template = _.merge(sipProfile, {
          manipulation_rules,
        });
        const query = compileJsonTemplate(template, { carrierId });
        logger.debug('gateway to provision ', query);
        // call requests one by one to make it recoverable in case of failure
        const res = await voiceProvisioningManagement.sipGatewayCreation(query);
        const sipGatewayId = res.body.id;
        logger.info(`gateway ${sipGatewayId} creation complete`);
        if (!sipGatewayId) {
          throw new ReferenceError('Invalid response from cps sip gateway creation: id is missing');
        }
        currentSipGateways = [...currentSipGateways, sipGatewayId];
      }
    } catch (e) {
      error = e;
    }
    let updates = null;
    if (currentSipGateways !== sipGateways) {
      updates = {
        results: {
          sipGateways: currentSipGateways,
        },
      };
    }
    if (error) {
      throw new IncompleteResultError(updates, error);
    }
    return updates;
  }

  createSipGateway.$meta = {
    name: SIP_GATEWAY_CREATION,
  };

  return createSipGateway;
}

export default createSipGatewayCreationTask;
