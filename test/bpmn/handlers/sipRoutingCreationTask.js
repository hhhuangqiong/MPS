import chai, { expect } from 'chai';
import sinon from 'sinon';
import { Logger } from 'winston';
import { ArgumentError, ArgumentNullError } from 'common-errors';
import chaiPromised from 'chai-as-promised';

import { createSipRoutingCreationTask, bpmnEvents } from '../../../src/bpmn';

chai.use(chaiPromised);

describe('bpmn/handlers/createSipRoutingCreationTask', () => {
  it('throws ArgumentError when any of dependencies is not provided', () => {
    const voiceProvisioningManagement = {};
    const templateService = {};
    const inputs = [
      [null, voiceProvisioningManagement],
      [templateService, null],
    ];
    inputs.forEach(args => {
      expect(() => createSipRoutingCreationTask(...args)).to.throw(ArgumentError);
    });
  });

  it('returns a function which name is SIP_ROUTING_CREATION', () => {
    const sipRoutingCreationTask = createSipRoutingCreationTask({}, {});
    expect(sipRoutingCreationTask.$meta.name).to.equal(bpmnEvents.SIP_ROUTING_CREATION);
  });

  it('throws ArgumentNullError when missing carrierId in state', async () => {
    const smsServicePlanCreationTask = createSipRoutingCreationTask({}, {});
    const state = { results: {} };
    const profile = {};
    const context = { logger: new Logger() };
    await expect(smsServicePlanCreationTask(state, profile, context)).to.be.rejectedWith(ArgumentNullError);
  });

  it('creates sip routing and return the sip routing profile id', async () => {
    const sipRoutingTemplate = {
      identifier: 'carrierId.profile',
      description: 'For carrierId carrier',
      trunks: [],
    };
    const createSipRoutingResponse = {
      body: {
        id: 'sipRoutingId',
      },
    };
    const voiceProvisioningManagement = {
      sipRoutingProfileCreation: sinon.stub().returns(createSipRoutingResponse),
    };
    const templateService = {
      render: sinon.stub().returns(sipRoutingTemplate),
    };
    const sipRoutingCreationTask = createSipRoutingCreationTask(templateService, voiceProvisioningManagement);

    const state = {
      results: {
        carrierId: 'carrierId',
      },
    };
    const profile = {};
    const context = {
      logger: new Logger(),
    };
    const res = await sipRoutingCreationTask(state, profile, context);
    expect(voiceProvisioningManagement.sipRoutingProfileCreation.calledOnce).to.be.true;
    expect(templateService.render.calledOnce).to.be.true;
    expect(res.results.sipRoutingProfileId).to.equal(createSipRoutingResponse.body.id);
  });

  it('throws ReferenceError when create sip routing and no id returned from voiceProvisioningManagement', async () => {
    const sipRoutingTemplate = {
      identifier: 'carrierId.profile',
      description: 'For carrierId carrier',
      trunks: [],
    };
    const incorrectCreateSipRoutingResponse = {
      body: {},
    };
    const voiceProvisioningManagement = {
      sipRoutingProfileCreation: sinon.stub().returns(incorrectCreateSipRoutingResponse),
    };
    const templateService = {
      render: sinon.stub().returns(sipRoutingTemplate),
    };
    const sipRoutingCreationTask = createSipRoutingCreationTask(templateService, voiceProvisioningManagement);

    const state = {
      results: {
        carrierId: 'carrierId',
      },
    };
    const profile = {};
    const context = {
      logger: new Logger(),
    };
    await expect(sipRoutingCreationTask(state, profile, context)).to.be.rejectedWith(ReferenceError);
    expect(voiceProvisioningManagement.sipRoutingProfileCreation.calledOnce).to.be.true;
    expect(templateService.render.calledOnce).to.be.true;
  });
});
