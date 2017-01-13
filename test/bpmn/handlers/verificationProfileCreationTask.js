import chai, { expect } from 'chai';
import sinon from 'sinon';
import { Logger } from 'winston';
import chaiPromised from 'chai-as-promised';
import { ArgumentNullError, ReferenceError, ArgumentError } from 'common-errors';

import { Capability, VerificationMethod } from '../../../src/domain';
import { createVerificationProfileCreationTask, bpmnEvents } from '../../../src/bpmn';

chai.use(chaiPromised);

describe('bpmn/handlers/createVerificationProfileCreationTask', () => {
  it('throws ArgumentError when any of dependencies is not provided', () => {
    const capabilitiesManagement = {};
    const verificationManagement = {};
    const templateService = {};
    const inputs = [
      [null, verificationManagement, capabilitiesManagement],
      [templateService, null, capabilitiesManagement],
      [templateService, verificationManagement, null],
    ];
    inputs.forEach((args) => {
      expect(() => createVerificationProfileCreationTask(...args)).to.throw(ArgumentError);
    });
  });

  it('returns a function which name is VERIFICATION_PROFILE_CREATION', () => {
    const verificationProfileCreationTask = createVerificationProfileCreationTask({}, {}, {});
    expect(verificationProfileCreationTask.$meta.name).to.equal(bpmnEvents.VERIFICATION_PROFILE_CREATION);
  });

  it('returns null when verificationProfileId was created', async () => {
    const templateService = {
      render: sinon.stub(),
    };
    const verificationManagement = {
      saveProfile: sinon.stub(),
    };
    const capabilitiesManagement = {
      getProfile: sinon.stub(),
    };
    const verificationProfileCreationTask = createVerificationProfileCreationTask(templateService,
      verificationManagement, capabilitiesManagement);
    const state = {
      results: {
        carrierId: 'carrierId',
        verificationProfileId: 'verificationProfileId',
      },
    };
    const profile = { capabilities: [Capability.VERIFICATION_SMS] };
    const context = { logger: new Logger() };
    const res = await verificationProfileCreationTask(state, profile, context);
    expect(res).to.be.null;
    expect(verificationManagement.saveProfile.called).to.be.false;
    expect(capabilitiesManagement.getProfile.called).to.be.false;
  });

  it('won\'t save verification profile when no verification capabilitiy', async () => {
    const templateService = {
      render: sinon.stub().returns({}),
    };
    const verificationManagement = {
      saveProfile: sinon.stub().returns({}),
    };
    const capabilitiesManagement = {
      getProfile: sinon.stub().returns({}),
    };
    const verificationProfileCreationTask = createVerificationProfileCreationTask(templateService,
      verificationManagement, capabilitiesManagement);
    const state = { results: { carrierId: 'carrierId' } };
    const profile = { capabilities: [Capability.CALL_ONNET] };
    const context = { logger: new Logger() };
    await expect(verificationProfileCreationTask(state, profile, context)).to.be.fulfilled;
    expect(templateService.render.calledOnce).to.be.false;
    expect(verificationManagement.saveProfile.calledOnce).to.be.false;
    expect(capabilitiesManagement.getProfile.calledOnce).to.be.false;
  });

  it('throws ArgumentNullError when missing carrierId in state', async () => {
    const verificationProfileCreationTask = createVerificationProfileCreationTask({}, {}, {});
    const state = { results: {} };
    const profile = { capabilities: [Capability.VERIFICATION_MO] };
    const context = { logger: new Logger() };
    await expect(verificationProfileCreationTask(state, profile, context)).to.be.rejectedWith(ArgumentNullError);
  });

  it('creates verification profile when has VERIFICATION_SMS capability', async () => {
    const verificationProfile = {
      identifier: 'carrierId.verification-profile',
    };
    const templateService = {
      render: sinon.stub().returns(verificationProfile),
    };
    const verificationProfileResponse = {
      body: {
        id: 'verifictaionProfileId',
      },
    };
    const verificationManagement = {
      saveProfile: sinon.stub().returns(verificationProfileResponse),
    };
    const SMSProfileResponse = {
      body: {
        identifier: 'smsProfileIdentifier',
      },
    };
    const capabilitiesManagement = {
      getProfile: sinon.stub().returns(SMSProfileResponse),
    };
    const verificationProfileCreationTask = createVerificationProfileCreationTask(templateService,
      verificationManagement, capabilitiesManagement);
    const state = { results: { carrierId: 'carrierId' } };
    const profile = { capabilities: [Capability.VERIFICATION_SMS] };
    const context = { logger: new Logger() };
    const res = await verificationProfileCreationTask(state, profile, context);
    expect(res.results.verificationProfileId).to.equal(verificationProfileResponse.body.id);
    expect(verificationManagement.saveProfile.calledOnce).to.be.true;
    expect(capabilitiesManagement.getProfile.calledOnce).to.be.true;
    expect(templateService.render.calledOnce).to.be.true;
    expect(verificationManagement.saveProfile.args[0][0]).to.equal(state.results.carrierId);
    expect(verificationManagement.saveProfile.args[0][1].enabled_verification_methods).to.include(VerificationMethod.SMS);
  });

  it('fails to create verification profile with VERIFICATION_SMS capability when missing sms profile', async () => {
    const verificationProfile = {
      identifier: 'carrierId.verification-profile',
    };
    const templateService = {
      render: sinon.stub().returns(verificationProfile),
    };
    const verificationManagement = {
      saveProfile: sinon.stub().returns({}),
    };
    const incorrectSMSProfileResponse = {
      body: {},
    };
    const capabilitiesManagement = {
      getProfile: sinon.stub().returns(incorrectSMSProfileResponse),
    };
    const verificationProfileCreationTask = createVerificationProfileCreationTask(templateService,
      verificationManagement, capabilitiesManagement);
    const state = { results: { carrierId: 'carrierId' } };
    const profile = { capabilities: [Capability.VERIFICATION_SMS] };
    const context = { logger: new Logger() };
    await expect(verificationProfileCreationTask(state, profile, context)).to.rejectedWith(ReferenceError);
    expect(verificationManagement.saveProfile.calledOnce).to.be.false;
    expect(capabilitiesManagement.getProfile.calledOnce).to.be.true;
  });

  it('creates verification profile when has multiple verification capability', async () => {
    const verificationProfile = {
      identifier: 'carrierId.verification-profile',
    };
    const templateService = {
      render: sinon.stub().returns(verificationProfile),
    };
    const verificationProfileResponse = {
      body: {
        id: 'verifictaionProfileId',
      },
    };
    const verificationManagement = {
      saveProfile: sinon.stub().returns(verificationProfileResponse),
    };
    const capabilitiesManagement = {
      getProfile: sinon.stub().returns({}),
    };
    const verificationProfileCreationTask = createVerificationProfileCreationTask(templateService,
      verificationManagement, capabilitiesManagement);
    const state = { results: { carrierId: 'carrierId' } };
    const profile = {
      capabilities: [
        Capability.VERIFICATION_IVR,
        Capability.VERIFICATION_MO,
        Capability.VERIFICATION_MT,
      ],
    };
    const context = { logger: new Logger() };
    const res = await verificationProfileCreationTask(state, profile, context);
    expect(res.results.verificationProfileId).to.equal(verificationProfileResponse.body.id);
    expect(verificationManagement.saveProfile.calledOnce).to.be.true;
    expect(capabilitiesManagement.getProfile.calledOnce).to.be.false;
    expect(templateService.render.calledOnce).to.be.true;
    expect(verificationManagement.saveProfile.args[0][0]).to.equal(state.results.carrierId);
    expect(verificationManagement.saveProfile.args[0][1].enabled_verification_methods).to
      .include.members([VerificationMethod.IVR, VerificationMethod.MO, VerificationMethod.MT]);
  });

  it('throws ReferenceError when no verifictaion profile id returned', async () => {
    const verificationProfile = {
      identifier: 'carrierId.verification-profile',
    };
    const templateService = {
      render: sinon.stub().returns(verificationProfile),
    };
    const verificationProfileResponse = {
      body: {},
    };
    const verificationManagement = {
      saveProfile: sinon.stub().returns(verificationProfileResponse),
    };
    const capabilitiesManagement = {};
    const verificationProfileCreationTask = createVerificationProfileCreationTask(templateService,
      verificationManagement, capabilitiesManagement);
    const state = { results: { carrierId: 'carrierId' } };
    const profile = {
      capabilities: [Capability.VERIFICATION_IVR],
    };
    const context = { logger: new Logger() };
    await expect(verificationProfileCreationTask(state, profile, context)).to.rejectedWith(ReferenceError);
    expect(verificationManagement.saveProfile.calledOnce).to.be.true;
  });
});
