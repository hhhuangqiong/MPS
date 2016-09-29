/**
 * Task to provision a initial sign-up rule
 */
import _ from 'lodash';
import { ArgumentNullError } from 'common-errors';
import ioc from '../../ioc';
import logger from '../../utils/logger';
import { createTask } from '../util/task';

import { Capabilities } from '../../models/Provisioning';
const { mumsConfig, MumsSignUpRuleMgmt } = ioc.container;
const { whitelistBlockAll } = _.get(mumsConfig, 'signup.rules');

function validateRerun(profile, taskResult) {
  if (taskResult.savedIds) {
    // run successfully before, skip
    return false;
  }

  return true;
}

function needWhitelistProvision(capabilities) {
  return _.intersection(capabilities, [Capabilities.END_USER_WHITELIST]).length > 0;
}

function run(data, cb) {
  const { capabilities, carrierId } = data;
  const rules = [];

  if (needWhitelistProvision(capabilities)) {
    rules.push(whitelistBlockAll);
  }

  if (!rules.length) {
    // skip if nothing to provision
    cb(null, data);
    return;
  }

  if (!carrierId) {
    cb(new ArgumentNullError('carrierId'));
    return;
  }

  MumsSignUpRuleMgmt.create({
    carrierId,
    rules,
  })
  .then((res) => {
    const { savedIds, failedMessages } = res.body;

    if (!_.isArray(savedIds) || savedIds.length <= 0) {
      logger.error('Fail to provision sign up rules');

      if (failedMessages) {
        logger.error('Failure messsages from backend: ', failedMessages);
        throw failedMessages;
      }

      throw new ReferenceError('Expecting `savedIds` but not available.');
    }

    cb(null, { savedIds });
  })
  .catch(cb);
}

export default createTask('MUMS_SIGNUP_RULE_PROVISION', run, { validateRerun });
