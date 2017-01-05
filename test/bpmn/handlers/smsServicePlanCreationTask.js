import chai, { expect } from 'chai';
import sinon from 'sinon';
import { ArgumentError, ArgumentNullError } from 'common-errors';
import chaiPromised from 'chai-as-promised';

import { createSmsServicePlanCreationTask, bpmnEvents } from '../../../src/bpmn';

chai.use(chaiPromised);

describe('bpmn/handlers/createSmsServicePlanCreationTask', () => {
  it('throws ArgumentError when any of dependencies is not provided', () => {
    const smsServicePlanManagement = {};
    const templateService = {};
    const inputs = [
      [null, smsServicePlanManagement],
      [templateService, null],
    ];
    inputs.forEach((args) => {
      expect(() => createSmsServicePlanCreationTask(...args)).to.throw(ArgumentError);
    });
  });

  it('returns a function which name is SMS_SERVICE_PLAN_CREATION', () => {
    const smsServicePlanCreationTask = createSmsServicePlanCreationTask({}, {});
    expect(smsServicePlanCreationTask.$meta.name).to.equal(bpmnEvents.SMS_SERVICE_PLAN_CREATION);
  });

  it('throws ArgumentNullError when missing carrierId in state', async () => {
    const smsServicePlanCreationTask = createSmsServicePlanCreationTask({}, {});
    const state = {
      results: {},
    };
    const profile = {};
    await expect(smsServicePlanCreationTask(state, profile)).to.be.rejectedWith(ArgumentNullError);
  });

  it('won\'t create sms service plan when already has servicePlanId in profile', async () => {
    const smsServicePlanManagement = {
      create: sinon.stub().returns({}),
    };
    const smsServicePlanCreationTask = createSmsServicePlanCreationTask({}, smsServicePlanManagement);
    const state = {
      results: {
        carrierId: 'carrierId',
      },
    };
    const profile = {
      smsc: {
        servicePlanId: 'servicePlanId',
      },
    };
    await expect(smsServicePlanCreationTask(state, profile)).to.be.fulfilled;
    expect(smsServicePlanManagement.create.calledOnce).to.be.false;
  });

  it('creates sms service plan when no servicePlanId in profile', async () => {
    const smsServicePlanTemplate = {
      identifier: 'carrierId.sms-service-plan',
      description: 'Service plan for carrierId',
    };
    const createSmsServicePlanResponse = {
      body: {
        id: 'servicePlanId',
      },
    };
    const smsServicePlanManagement = {
      create: sinon.stub().returns(createSmsServicePlanResponse),
    };
    const templateService = {
      render: sinon.stub().returns(smsServicePlanTemplate),
    };
    const smsServicePlanCreationTask = createSmsServicePlanCreationTask(templateService, smsServicePlanManagement);

    const state = {
      results: {
        carrierId: 'carrierId',
      },
    };
    const profile = {
      smsc: {},
    };
    const res = await smsServicePlanCreationTask(state, profile);
    expect(smsServicePlanManagement.create.calledOnce).to.be.true;
    expect(templateService.render.calledOnce).to.be.true;
    expect(res.results.smsServicePlanId).to.equal(createSmsServicePlanResponse.body.id);
  });

  it('throws ReferenceError when no servicePlan id returned', async () => {
    const smsServicePlanTemplate = {
      identifier: 'carrierId.sms-service-plan',
      description: 'Service plan for carrierId',
    };
    const incorrectCreateSmsServicePlanResponse = {
      body: {},
    };
    const smsServicePlanManagement = {
      create: sinon.stub().returns(incorrectCreateSmsServicePlanResponse),
    };
    const templateService = {
      render: sinon.stub().returns(smsServicePlanTemplate),
    };
    const smsServicePlanCreationTask = createSmsServicePlanCreationTask(templateService, smsServicePlanManagement);

    const state = {
      results: {
        carrierId: 'carrierId',
      },
    };
    const profile = {
      smsc: {},
    };
    await expect(smsServicePlanCreationTask(state, profile)).to.be.rejectedWith(ReferenceError);
    expect(smsServicePlanManagement.create.calledOnce).to.be.true;
    expect(templateService.render.calledOnce).to.be.true;
  });
});
