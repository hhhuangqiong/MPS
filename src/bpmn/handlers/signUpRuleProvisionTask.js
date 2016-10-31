import _ from 'lodash';
import { ArgumentNullError } from 'common-errors';

import { check } from './../../util';
import { Capability } from './../../domain';
import { SIGN_UP_RULE_PROVISION } from './bpmnEvents';

export function createSignUpRuleProvisionTask(templateService, signUpRuleManagement) {
  check.ok('templateService', templateService);
  check.ok('signUpRuleManagement', signUpRuleManagement);

  async function provisionSignUpRules(state, profile, context) {
    if (!profile.capabilities.includes(Capability.END_USER_WHITELIST)) {
      return null;
    }
    if (state.results.signUpRuleIds.length > 0) {
      return null;
    }
    const { whitelistBlockAll } = await templateService.get('signup.rules');
    const { logger } = context;
    const { carrierId } = state.results;
    if (!carrierId) {
      throw new ArgumentNullError('carrierId');
    }
    const rules = [whitelistBlockAll];
    const res = await signUpRuleManagement.create({ carrierId, rules });
    const { savedIds, failedMessages } = res.body;
    if (!_.isArray(savedIds) || savedIds.length === 0) {
      logger.error('Fail to provision sign up rules');
      if (failedMessages) {
        logger.error('Failure messsages from backend: ', failedMessages);
        const messages = failedMessages.map(x => x.errorDetails.message).join('\n');
        throw new ReferenceError(`Sign up rules provisioning failed: ${messages}`);
      }
      throw new ReferenceError('Expecting `savedIds` but not available.');
    }
    return {
      results: {
        signUpRuleIds: savedIds,
      },
    };
  }

  provisionSignUpRules.$meta = {
    name: SIGN_UP_RULE_PROVISION,
  };

  return provisionSignUpRules;
}

export default createSignUpRuleProvisionTask;
