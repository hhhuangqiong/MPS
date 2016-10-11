import _ from 'lodash';
import { ArgumentNullError } from 'common-errors';

import { check, createTask } from './util';
import { Capability } from './../../domain';

export function createMumsSignUpRuleProvisionTask(logger, mumsOptions, mumsSignUpRuleMgmt) {
  check.ok('logger', logger);
  check.ok('mumsOptions', mumsOptions);
  check.ok('mumsSignUpRuleMgmt', mumsSignUpRuleMgmt);

  const { whitelistBlockAll } = _.get(mumsOptions, 'signup.rules');

  function validateRerun(profile, taskResult) {
    if (taskResult.savedIds) {
      // run successfully before, skip
      return false;
    }

    return true;
  }

  function needWhitelistProvision(capabilities) {
    return _.intersection(capabilities, [Capability.END_USER_WHITELIST]).length > 0;
  }

  function run(data, cb) {
    const { capabilities, carrierId } = data;
    const rules = [];

    if (needWhitelistProvision(capabilities)) {
      rules.push(whitelistBlockAll);
    }

    if (!rules.length) {
      // skip if nothing to provision
      cb(null, {});
      return;
    }

    if (!carrierId) {
      cb(new ArgumentNullError('carrierId'));
      return;
    }

    mumsSignUpRuleMgmt.create({
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

  return createTask('MUMS_SIGNUP_RULE_PROVISION', run, { validateRerun }, logger);
}

export default createMumsSignUpRuleProvisionTask;
