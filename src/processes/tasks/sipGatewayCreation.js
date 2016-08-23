import { ArgumentNullError, InvalidOperationError } from 'common-errors';

import ioc from '../../ioc';
import { createTask } from '../util/task';
import leftPad from 'left-pad';
import logger from '../../utils/logger';
import { compileJsonTemplate } from '../../utils/nconf';

const { VoiceProvisioningManagement } = ioc.container;
const { sip } = ioc.container.cpsConfig;
const template = sip.gateway.template;
const timesToGenerate = sip.gateway.timesToGenerate;

function getStartIndex(taskResult) {
  if (!taskResult) return 1;
  return Object.keys(taskResult).length + 1;
}

function validateRerun(data, taskResult) {
  const start = getStartIndex(taskResult);
  if (start >= timesToGenerate) {
    // skip if all generated
    logger(`Skip on rerun as all sip gateways generated: timesToGenerate=${timesToGenerate}`);
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

  if (!timesToGenerate) {
    cb(null, {});
    return;
  }
  const start = getStartIndex(taskResult);

  logger(`Creating ${timesToGenerate} sip gateways for ${carrierId} starting from ${start}`);

  if (start >= timesToGenerate) {
    cb(new InvalidOperationError(`invalid sip gateway timesToGenerate: ${timesToGenerate}`));
    return;
  }

  const results = {};
  let pending = Promise.resolve();
  for (let i = start; i < timesToGenerate + 1; i++) {
    const query = compileJsonTemplate(template, { carrierId, generateNumber: leftPad(i, 2, 0) });
    // call requests one by one to make it recoverable incase of failure
    pending = pending.then(() => (
      VoiceProvisioningManagement.sipGatewayCreation(query)
        .then((res) => {
          const sipGatewayId = res.body.id;
          logger(`gateway ${sipGatewayId} creation complete`);
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
