import { ArgumentNullError } from 'common-errors';
import _ from 'lodash';
import escapeStringRegexp from 'escape-string-regexp';

import { check, createTask, compileJsonTemplate } from './util';

export function createSipRoutingCreationTask(logger, cpsOptions, voiceProvisioningManagement) {
  check.ok('logger', logger);
  check.ok('cpsOptions', cpsOptions);
  check.ok('voiceProvisioningManagement', voiceProvisioningManagement);

  const { sip } = cpsOptions;
  const template = sip.routing.template;

  function validateRerun(data, taskResult) {
    const { sipRoutingProfileId } = taskResult;
    if (taskResult.sipRoutingProfileId) {
      logger.info(`skip sip profile creation on rerun: ${sipRoutingProfileId}`);
      return false;
    }

    return true;
  }

  function run(data, taskResult, cb) {
    const { carrierId } = data;

    if (!carrierId) {
      cb(new ArgumentNullError('carrierId'));
      return;
    }

    const escapedCarrierId = escapeStringRegexp(carrierId);

    // expecting create gateway ids to be passed in from data
    const templateParams = _.extend({ carrierId, escapedCarrierId }, data);
    const query = compileJsonTemplate(template, templateParams);

    // call requests one by one to make it recoverable incase of failure
    voiceProvisioningManagement.sipRoutingProfileCreation(query)
      .then((res) => {
        const sipRoutingProfileId = res.body.id;
        logger.info(`sip routing profile ${sipRoutingProfileId} creation complete`);

        if (!sipRoutingProfileId) {
          throw new ReferenceError('Invalid response from cps sip routing profile creation: id is missing');
        }

        cb(null, { sipRoutingProfileId });
      })
      .catch(cb);
  }

  return createTask('SIP_ROUTING_CREATION', run, { validateRerun }, logger);
}

export default createSipRoutingCreationTask;
