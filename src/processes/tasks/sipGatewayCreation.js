import { ArgumentNullError, InvalidOperationError } from 'common-errors';

import _ from 'lodash';
import ioc from '../../ioc';
import { createTask } from '../util/task';
import logger from '../../utils/logger';
import { compileJsonTemplate } from '../../utils/nconf';

const { VoiceProvisioningManagement } = ioc.container;
const { sip } = ioc.container.cpsConfig;

// A template is compsite of 2 parts
// 1. profile - different for each gateway
// 2. manipulation_rules - same for all provisioned gateways
// All gateway profiles should be provisioned with same manipulation_rules
const { profiles, manipulation_rules } = sip.gateway.template;
const profilesToGenerate = profiles.length;

function getStartIndex(taskResult) {
  if (!taskResult) return 0;
  return Object.keys(taskResult).length;
}

function validateRerun(data, taskResult) {
  const start = getStartIndex(taskResult);
  if (start >= profilesToGenerate) {
    // skip if all generated
    logger.info(`Skip on rerun as all sip gateways generated: profilesToGenerate=${profilesToGenerate}`);
    return false;
  }

  return true;
}

function run(data, taskResult, cb) {
  const { carrierId } = data;

  if (!data) {
    cb(new ArgumentNullError('carrierId'));
    return;
  }

  const start = getStartIndex(taskResult);

  logger.info(`Creating ${profilesToGenerate} sip gateways for ${carrierId} starting from ${start}`);

  if (start >= profilesToGenerate) {
    cb(new InvalidOperationError(`invalid sip gateway profilesToGenerate: ${profilesToGenerate}`));
    return;
  }

  const results = {};
  let pending = Promise.resolve();
  for (let i = start; i < profilesToGenerate; i++) {
    const profile = profiles[i];
    const template = _.merge(profile, {
      manipulation_rules,
    });
    const query = compileJsonTemplate(template, { carrierId });
    logger.debug('gateway to provision ', query);
    // call requests one by one to make it recoverable incase of failure
    pending = pending.then(() => (
      VoiceProvisioningManagement.sipGatewayCreation(query)
        .then((res) => {
          const sipGatewayId = res.body.id;
          logger.info(`gateway ${sipGatewayId} creation complete`);
          if (!sipGatewayId) {
            throw new ReferenceError('Invalid response from cps sip gateway creation: id is missing');
          }
          results[`sipGatewayId${i}`] = sipGatewayId;
        })
      ));
  }

  pending.then(() => {
    cb(null, results);
  }).catch((err) => {
    // caught and stop on any error, return results completed
    cb(err, results);
  });
}

export default createTask('SIP_GATEWAY_CREATION', run, { validateRerun });
