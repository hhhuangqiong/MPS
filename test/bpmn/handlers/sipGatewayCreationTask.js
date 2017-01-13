import chai, { expect } from 'chai';
import sinon from 'sinon';
import { Logger } from 'winston';
import _ from 'lodash';
import { ArgumentError, IncompleteResultError } from 'common-errors';
import chaiPromised from 'chai-as-promised';

import { createSipGatewayCreationTask, bpmnEvents } from '../../../src/bpmn';

chai.use(chaiPromised);

describe('bpmn/handlers/createSipGatewayCreationTask', () => {
  it('throws ArgumentError when any of dependencies is not provided', () => {
    const voiceProvisioningManagement = {};
    const templateService = {};
    const inputs = [
      [null, voiceProvisioningManagement],
      [templateService, null],
    ];
    inputs.forEach(args => {
      expect(() => createSipGatewayCreationTask(...args)).to.throw(ArgumentError);
    });
  });

  it('returns a function which name is SIP_GATEWAY_CREATION', () => {
    const sipGatewayCreationTask = createSipGatewayCreationTask({}, {});
    expect(sipGatewayCreationTask.$meta.name).to.equal(bpmnEvents.SIP_GATEWAY_CREATION);
  });

  it('returns null when all sip gateways in profile are created', async () => {
    const sipGatewaysProfiles = [{
      identifier: 'carrierId.gateway.tsbc1',
      description: 'Transcoding SBC #1',
      host: '192.168.35.50',
      port: 5080,
    }, {
      identifier: 'carrierId.gateway.tsbc2',
      description: 'Transcoding SBC #2',
      host: '192.168.35.50',
      port: 5080,
    }];
    const voiceProvisioningManagement = {
      sipGatewayCreation: () => {},
    };
    const templateService = {
      get: sinon.stub().returns({
        profiles: sipGatewaysProfiles,
      }),
    };
    const sipGatewayCreationStub = sinon.stub(voiceProvisioningManagement,
     'sipGatewayCreation', profile => ({
       body: {
         id: profile.identifier,
       },
     }));
    const sipGatewayCreationTask = createSipGatewayCreationTask(templateService, voiceProvisioningManagement);

    const state = {
      results: {
        sipGateways: [
          'carrierId.gateway.tsbc1',
          'carrierId.gateway.tsbc2',
        ],
      },
    };
    const profile = {};
    const context = {
      logger: new Logger(),
    };
    await expect(sipGatewayCreationTask(state, profile, context)).to.be.fulfilled;
    expect(sipGatewayCreationStub.called).to.be.false;
  });

  it('skips creation when sipGatewaysProfiles were created', async () => {
    const sipGatewaysProfiles = [{
      identifier: 'carrierId.gateway.tsbc1',
      description: 'Transcoding SBC #1',
      host: '192.168.35.50',
      port: 5080,
    }, {
      identifier: 'carrierId.gateway.tsbc2',
      description: 'Transcoding SBC #2',
      host: '192.168.35.50',
      port: 5080,
    }];
    const voiceProvisioningManagement = {
      sipGatewayCreation: sinon.stub(),
    };
    const templateService = {
      get: sinon.stub().returns({
        profiles: sipGatewaysProfiles,
      }),
      render: sinon.stub(),
    };
    const sipGatewayCreationTask = createSipGatewayCreationTask(templateService, voiceProvisioningManagement);

    const state = {
      results: {
        sipGateways: ['carrierId.gateway.tsbc1', 'carrierId.gateway.tsbc2'],
      },
    };
    const profile = {};
    const context = {
      logger: new Logger(),
    };
    const res = await sipGatewayCreationTask(state, profile, context);
    expect(res).to.be.null;
    expect(templateService.get.calledOnce).to.be.true;
    expect(templateService.render.called).to.be.false;
    expect(voiceProvisioningManagement.sipGatewayCreation.called).to.be.false;
  });

  it('creates sip gateway when sip gateways in profile aren\'t created', async () => {
    const sipGatewaysProfiles = [{
      identifier: 'carrierId.gateway.tsbc1',
      description: 'Transcoding SBC #1',
      host: '192.168.35.50',
      port: 5080,
    }, {
      identifier: 'carrierId.gateway.tsbc2',
      description: 'Transcoding SBC #2',
      host: '192.168.35.50',
      port: 5080,
    }];
    const voiceProvisioningManagement = {
      sipGatewayCreation: () => {},
    };
    const templateService = {
      get: sinon.stub().returns({
        profiles: sipGatewaysProfiles,
      }),
      render: sinon.stub().returns({
        profiles: sipGatewaysProfiles,
      }),
    };
    const sipGatewayCreationStub = sinon.stub(voiceProvisioningManagement,
     'sipGatewayCreation', profile => ({
       body: {
         id: profile.identifier,
       },
     }));
    const sipGatewayCreationTask = createSipGatewayCreationTask(templateService, voiceProvisioningManagement);

    const state = {
      results: {
        sipGateways: [],
      },
    };
    const profile = {};
    const context = {
      logger: new Logger(),
    };
    const res = await sipGatewayCreationTask(state, profile, context);
    expect(sipGatewayCreationStub.calledTwice).to.be.true;
    expect(res.results.sipGateways).to.include.members(_.map(sipGatewaysProfiles, 'identifier'));
  });

  it('throws IncompleteResultError when incorrect response and thus error during creating sip gateway', async () => {
    const sipGatewaysProfiles = [{
      identifier: 'carrierId.gateway.tsbc1',
      description: 'Transcoding SBC #1',
      host: '192.168.35.50',
      port: 5080,
    }, {
      identifier: 'carrierId.gateway.tsbc2',
      description: 'Transcoding SBC #2',
      host: '192.168.35.50',
      port: 5080,
    }];
    const voiceProvisioningManagement = {
      sipGatewayCreation: sinon.stub().returns({}),
    };
    const templateService = {
      get: sinon.stub().returns({
        profiles: sipGatewaysProfiles,
      }),
      render: sinon.stub().returns({
        profiles: sipGatewaysProfiles,
      }),
    };
    const sipGatewayCreationTask = createSipGatewayCreationTask(templateService, voiceProvisioningManagement);
    const state = {
      results: {
        sipGateways: [],
      },
    };
    const profile = {};
    const context = {
      logger: new Logger(),
    };
    await expect(sipGatewayCreationTask(state, profile, context)).to.be.rejectedWith(IncompleteResultError);
    expect(voiceProvisioningManagement.sipGatewayCreation.called).to.be.true;
  });
});
