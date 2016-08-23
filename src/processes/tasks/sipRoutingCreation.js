import { ArgumentNullError } from 'common-errors';
import _ from 'lodash';
import escapeStringRegexp from 'escape-string-regexp';

import ioc from '../../ioc';
import { createTask } from '../util/task';
import logger from '../../utils/logger';
import { compileJsonTemplate } from '../../utils/nconf';

const { VoiceProvisioningManagement } = ioc.container;
const { sip } = ioc.container.cpsConfig;
const template = sip.routing.template;

function validateRerun(data, taskResult) {
  const { sipRoutingProfileId } = taskResult;
  if (taskResult.sipRoutingProfileId) {
    logger(`skip sip profile creation on rerun: ${sipRoutingProfileId}`);
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
  VoiceProvisioningManagement.sipRoutingProfileCreation(query)
    .then((res) => {
      const sipRoutingProfileId = res.body.id;
      logger(`sip routing profile ${sipRoutingProfileId} creation complete`);

      if (!sipRoutingProfileId) {
        throw new ReferenceError('Invalid response from cps sip routing profile creation: id is missing');
      }

      cb(null, { sipRoutingProfileId });
    })
    .catch(cb);
}

export default createTask('SIP_ROUTING_CREATION', run, { validateRerun });
