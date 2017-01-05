import chai, { expect } from 'chai';
import sinon from 'sinon';
import chaiPromised from 'chai-as-promised';
import { ReferenceError, ArgumentError } from 'common-errors';

import { Capability } from '../../../src/domain';
import { createVoiceCapabilityActivationTask, bpmnEvents } from '../../../src/bpmn';

chai.use(chaiPromised);

describe('bpmn/handlers/createVoiceCapabilityActivationTask', () => {
  it('throws ArgumentError when any of dependencies is not provided', () => {
    const capabilitiesManagement = {};
    const templateService = {};
    const inputs = [
      [null, capabilitiesManagement],
      [templateService, null],
    ];
    inputs.forEach((args) => {
      expect(() => createVoiceCapabilityActivationTask(...args)).to.throw(ArgumentError);
    });
  });

  it('returns a function which name is VOICE_CAPABILITY_ACTIVATION', () => {
    const voiceCapabilityActivationTask = createVoiceCapabilityActivationTask({}, {});
    expect(voiceCapabilityActivationTask.$meta.name).to.equal(bpmnEvents.VOICE_CAPABILITY_ACTIVATION);
  });

  it('won\'t enable voice capability when no capability in profile', async () => {
    const templateService = {
      get: sinon.stub().returns({}),
    };
    const capabilitiesManagement = {
      enableVoiceCapability: sinon.stub().returns({}),
    };
    const voiceCapabilityActivationTask = createVoiceCapabilityActivationTask(templateService, capabilitiesManagement);
    const state = {
      results: {
        carrierId: 'carrierId',
        sipRoutingProfileId: 'sipRoutingProfileId',
      },
    };
    const profile = { capabilities: [] };
    await expect(voiceCapabilityActivationTask(state, profile)).to.be.fulfilled;
    expect(templateService.get.calledOnce).to.be.false;
    expect(capabilitiesManagement.enableVoiceCapability.calledOnce).to.be.false;
  });

  it('enables voice capability when CALL_ONNET in profile capability', async () => {
    const chargeProfile = 'm800_charge_profile';
    const templateService = {
      get: sinon.stub().returns(chargeProfile),
    };
    const enableVoiceCapabilityResponse = {
      body: {
        id: 'voiceCapabilityId',
      },
    };
    const capabilitiesManagement = {
      enableVoiceCapability: sinon.stub().returns(enableVoiceCapabilityResponse),
    };
    const voiceCapabilityActivationTask = createVoiceCapabilityActivationTask(templateService, capabilitiesManagement);
    const state = {
      results: {
        carrierId: 'carrierId',
        sipRoutingProfileId: 'sipRoutingProfileId',
      },
    };
    const profile = { capabilities: [Capability.CALL_ONNET] };
    const res = await voiceCapabilityActivationTask(state, profile);
    expect(res.results.voiceProfileId).to.equal(enableVoiceCapabilityResponse.body.id);
    expect(templateService.get.calledOnce).to.be.true;
    expect(capabilitiesManagement.enableVoiceCapability.calledOnce).to.be.true;
    expect(capabilitiesManagement.enableVoiceCapability.args[0][0]).to.deep.equal({
      carrierId: state.results.carrierId,
      sipRoutingProfileId: state.results.sipRoutingProfileId,
      enableOnnetCharging: true,
      enableOffnetCharging: false,
      chargingProfile: chargeProfile,
    });
  });

  it('enables voice capability when CALL_OFFNET in profile capability', async () => {
    const chargeProfile = 'm800_charge_profile';
    const templateService = {
      get: sinon.stub().returns(chargeProfile),
    };
    const enableVoiceCapabilityResponse = {
      body: {
        id: 'voiceCapabilityId',
      },
    };
    const capabilitiesManagement = {
      enableVoiceCapability: sinon.stub().returns(enableVoiceCapabilityResponse),
    };
    const voiceCapabilityActivationTask = createVoiceCapabilityActivationTask(templateService, capabilitiesManagement);
    const state = {
      results: {
        carrierId: 'carrierId',
        sipRoutingProfileId: 'sipRoutingProfileId',
      },
    };
    const profile = { capabilities: [Capability.CALL_OFFNET] };
    const res = await voiceCapabilityActivationTask(state, profile);
    expect(res.results.voiceProfileId).to.equal(enableVoiceCapabilityResponse.body.id);
    expect(templateService.get.calledOnce).to.be.true;
    expect(capabilitiesManagement.enableVoiceCapability.calledOnce).to.be.true;
    expect(capabilitiesManagement.enableVoiceCapability.args[0][0]).to.deep.equal({
      carrierId: state.results.carrierId,
      sipRoutingProfileId: state.results.sipRoutingProfileId,
      enableOnnetCharging: false,
      enableOffnetCharging: true,
      chargingProfile: chargeProfile,
    });
  });

  it('enables voice capability when CALL_MAAII_IN in profile capability', async () => {
    const chargeProfile = 'm800_charge_profile';
    const templateService = {
      get: sinon.stub().returns(chargeProfile),
    };
    const enableVoiceCapabilityResponse = {
      body: {
        id: 'voiceCapabilityId',
      },
    };
    const capabilitiesManagement = {
      enableVoiceCapability: sinon.stub().returns(enableVoiceCapabilityResponse),
    };
    const voiceCapabilityActivationTask = createVoiceCapabilityActivationTask(templateService, capabilitiesManagement);
    const state = {
      results: {
        carrierId: 'carrierId',
        sipRoutingProfileId: 'sipRoutingProfileId',
      },
    };
    const profile = { capabilities: [Capability.CALL_MAAII_IN] };
    const res = await voiceCapabilityActivationTask(state, profile);
    expect(res.results.voiceProfileId).to.equal(enableVoiceCapabilityResponse.body.id);
    expect(templateService.get.calledOnce).to.be.true;
    expect(capabilitiesManagement.enableVoiceCapability.calledOnce).to.be.true;
    expect(capabilitiesManagement.enableVoiceCapability.args[0][0]).to.deep.equal({
      carrierId: state.results.carrierId,
      sipRoutingProfileId: state.results.sipRoutingProfileId,
      enableOnnetCharging: false,
      enableOffnetCharging: false,
      chargingProfile: chargeProfile,
    });
  });

  it('throws ReferenceError when missing id in enableVoiceCapability response', async () => {
    const chargeProfile = 'm800_charge_profile';
    const templateService = {
      get: sinon.stub().returns(chargeProfile),
    };
    const incorrectEnableVoiceCapabilityResponse = { body: {} };
    const capabilitiesManagement = {
      enableVoiceCapability: sinon.stub().returns(incorrectEnableVoiceCapabilityResponse),
    };
    const voiceCapabilityActivationTask = createVoiceCapabilityActivationTask(templateService, capabilitiesManagement);
    const state = {
      results: {
        carrierId: 'carrierId',
        sipRoutingProfileId: 'sipRoutingProfileId',
      },
    };
    const profile = { capabilities: [Capability.CALL_MAAII_IN] };
    await expect(voiceCapabilityActivationTask(state, profile)).to.be.rejectedWith(ReferenceError);
  });
});
