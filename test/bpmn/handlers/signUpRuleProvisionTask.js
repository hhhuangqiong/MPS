import chai, { expect } from 'chai';
import sinon from 'sinon';
import { Logger } from 'winston';
import { ArgumentError, ArgumentNullError } from 'common-errors';
import chaiPromised from 'chai-as-promised';

import { Capability } from '../../../src/domain';
import { createSignUpRuleProvisionTask, bpmnEvents } from '../../../src/bpmn';

chai.use(chaiPromised);

describe('bpmn/handlers/createSignUpRuleProvisionTask', () => {
  it('throws ArgumentError when any of dependencies is not provided', () => {
    const signUpRuleManagement = {};
    const templateService = {};
    const inputs = [
      [null, signUpRuleManagement],
      [templateService, null],
    ];
    inputs.forEach(args => {
      expect(() => createSignUpRuleProvisionTask(...args)).to.throw(ArgumentError);
    });
  });

  it('returns a function which name is SIGN_UP_RULE_PROVISION', () => {
    const sipGatewayCreationTask = createSignUpRuleProvisionTask({}, {});
    expect(sipGatewayCreationTask.$meta.name).to.equal(bpmnEvents.SIGN_UP_RULE_PROVISION);
  });

  it('returns null when signUpRuleIds was created', async () => {
    const templateService = {
      get: sinon.stub(),
    };
    const signUpRuleManagement = {
      create: sinon.stub(),
    };
    const signUpRuleProvisionTask = createSignUpRuleProvisionTask(templateService, signUpRuleManagement);
    const state = {
      results: {
        carrierId: 'carrierId',
        signUpRuleIds: ['signUpRuleId'],
      },
    };
    const profile = {
      capabilities: [Capability.END_USER_WHITELIST],
    };
    const context = {
      logger: new Logger(),
    };
    const res = await signUpRuleProvisionTask(state, profile, context);
    expect(signUpRuleManagement.create.called).to.be.false;
    expect(templateService.get.called).to.be.false;
    expect(res).to.be.null;
  });

  it('skips sign up rule provision when no capability END_USER_WHITELIST in profile', async () => {
    const templateService = {
      get: sinon.stub().returns({}),
    };
    const signUpRuleManagement = {
      create: sinon.stub().returns({}),
    };
    const signUpRuleProvisionTask = createSignUpRuleProvisionTask(templateService, signUpRuleManagement);
    const state = {
      results: {
        carrierId: 'carrierId',
        signUpRuleIds: [],
      },
    };
    const profile = {
      capabilities: [Capability.IM],
    };
    const context = {
      logger: new Logger(),
    };
    await expect(signUpRuleProvisionTask(state, profile, context)).to.be.fulfilled;
    expect(signUpRuleManagement.create.called).to.be.false;
  });

  it('throws ArgumentNullError when no carrierId in state', async () => {
    const templateService = {
      get: sinon.stub().returns({}),
    };
    const signUpRuleManagement = {
      create: sinon.stub().returns({}),
    };
    const signUpRuleProvisionTask = createSignUpRuleProvisionTask(templateService, signUpRuleManagement);
    const state = {
      results: {
        signUpRuleIds: [],
      },
    };
    const profile = {
      capabilities: [Capability.END_USER_WHITELIST],
    };
    const context = {
      logger: new Logger(),
    };
    await expect(signUpRuleProvisionTask(state, profile, context)).to.be.rejectedWith(ArgumentNullError);
    expect(signUpRuleManagement.create.called).to.be.false;
  });

  it('creates signup rules', async () => {
    const whitelistRules = {
      applicationVersionStatus: 'RELEASED',
      group: 'DEFAULT',
      identityType: 'PHONE_NUMBER',
      identity: '(.)+',
      regex: true,
      policy: 'BLOCK',
      order: 99999,
      comments: 'Do not allow anyone to signup unless specifically allowed.',
      updatedUser: 'Maaii Provisioning Service',
    };
    const templateService = {
      get: sinon.stub().returns(whitelistRules),
    };
    const signUpRulesResponse = {
      body: {
        savedIds: ['rulesId'],
      },
    };
    const signUpRuleManagement = {
      create: sinon.stub().returns(signUpRulesResponse),
    };
    const signUpRuleProvisionTask = createSignUpRuleProvisionTask(templateService, signUpRuleManagement);
    const state = {
      results: {
        carrierId: 'carrierId',
        signUpRuleIds: [],
      },
    };
    const profile = {
      capabilities: [Capability.END_USER_WHITELIST],
    };
    const context = {
      logger: new Logger(),
    };
    const res = await signUpRuleProvisionTask(state, profile, context);
    expect(signUpRuleManagement.create.calledOnce).to.be.true;
    expect(templateService.get.calledOnce).to.be.true;
    expect(res.results.signUpRuleIds).to.equal(signUpRulesResponse.body.savedIds);
  });

  it('throws ReferenceError when creates signup rules received incorrect response', async () => {
    const whitelistRules = {
      applicationVersionStatus: 'RELEASED',
      group: 'DEFAULT',
      identityType: 'PHONE_NUMBER',
      identity: '(.)+',
      regex: true,
      policy: 'BLOCK',
      order: 99999,
      comments: 'Do not allow anyone to signup unless specifically allowed.',
      updatedUser: 'Maaii Provisioning Service',
    };
    const templateService = {
      get: sinon.stub().returns(whitelistRules),
    };
    const signUpRulesResponse = {
      body: {
        failedMessages: [{
          errorDetails: {
            message: 'fail1',
          },
        }, {
          errorDetails: {
            message: 'fail2',
          },
        }],
      },
    };
    const signUpRuleManagement = {
      create: sinon.stub().returns(signUpRulesResponse),
    };
    const signUpRuleProvisionTask = createSignUpRuleProvisionTask(templateService, signUpRuleManagement);
    const state = {
      results: {
        carrierId: 'carrierId',
        signUpRuleIds: [],
      },
    };
    const profile = {
      capabilities: [Capability.END_USER_WHITELIST],
    };
    const context = {
      logger: new Logger(),
    };
    await expect(signUpRuleProvisionTask(state, profile, context)).to.be.rejectedWith(ReferenceError);
    expect(signUpRuleManagement.create.calledOnce).to.be.true;
    expect(templateService.get.calledOnce).to.be.true;
  });
});
