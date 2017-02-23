import chai, { expect } from 'chai';
import sinon from 'sinon';
import chaiPromised from 'chai-as-promised';
import { ArgumentError } from 'common-errors';

import createCapabilityActivationTask from './../../../src/bpmn/handlers/createCapabilityActivationTask';
import { Capability, CapabilityType } from './../../../src/domain';
chai.use(chaiPromised);

describe('bpmn/handlers/createCapabilityActivationTask', () => {
  it('throws ArgumentError when capabilitiesManagement is not provided', () => {
    const capabilityOptions = {};
    expect(() => createCapabilityActivationTask(null, capabilityOptions)).to.throw(ArgumentError);
  });
  describe('activateCapability', () => {
    it('returns null if it should not be activated', async () => {
      const capabilityOptions = {
        requirements: [Capability.IM],
        internal: Capability.IM,
        external: CapabilityType.IM,
      };
      const state = {
        results: {
          capabilities: [Capability.IM],
          carrierId: '123',
        },
      };
      const profile = { capabilities: ['im'] };
      const capabilitiesManagement = { enableCapabilityByType: sinon.stub() };
      const activateCapability = createCapabilityActivationTask(capabilitiesManagement, capabilityOptions);
      await expect(activateCapability(state, profile)).to.eventually.equal(null);
    });
    it('returns capabilities which are activated', async () => {
      const capabilityOptions = {
        requirements: ['im.im-to-sms'],
        internal: 'im.im-to-sms',
        external: 'im',
      };
      const profile = {
        capabilities: ['im.im-to-sms'],
      };
      const state = {
        results: {
          capabilities: ['call.onnet'],
          carrierId: '123',
        },
      };
      const res = {};
      const capabilitiesManagement = {
        enableCapabilityByType: sinon.stub().returns(res),
      };
      const activateCapability = createCapabilityActivationTask(capabilitiesManagement, capabilityOptions);
      const result = await activateCapability(state, profile);
      expect(result.results.capabilities).to.deep.equal(state.results.capabilities.concat([capabilityOptions.internal]));
    });
  });
});
