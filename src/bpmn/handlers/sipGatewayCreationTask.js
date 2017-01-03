import { ReferenceError } from 'common-errors';
import _ from 'lodash';
import { check } from 'm800-util';

import { SIP_GATEWAY_CREATION } from './bpmnEvents';
import { IncompleteResultError } from './common';

export function createSipGatewayCreationTask(templateService, voiceProvisioningManagement) {
  check.ok('templateService', templateService);
  check.ok('voiceProvisioningManagement', voiceProvisioningManagement);

  async function createSipGateway(state, profile, context) {
    const { logger } = context;
    const { sipGateways, carrierId } = state.results;
    const { profiles } = await templateService.get('cps.sip.gateway');

    const profilesToGenerate = profiles.length;

    if (_.keys(sipGateways).length >= profilesToGenerate) {
      logger.info(`Skip on rerun as all sip gateways generated: profilesToGenerate=${profilesToGenerate}`);
      return null;
    }
    const start = _.keys(sipGateways).length;
    logger.info(`Creating ${profilesToGenerate} sip gateways for ${carrierId} starting from ${start}`);
    let currentSipGateways = sipGateways;
    let error = null;

    const gateway = await templateService.render('cps.sip.gateway', { carrierId });
    try {
      for (let i = start; i < profilesToGenerate; i++) {
        const command = {
          ...gateway.profiles[i],
          manipulation_rules: gateway.manipulation_rules,
        };
        logger.debug('gateway to provision ', command);
        // call requests one by one to make it recoverable in case of failure
        const res = await voiceProvisioningManagement.sipGatewayCreation(command);
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
