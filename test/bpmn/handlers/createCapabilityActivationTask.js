import chai, { expect } from 'chai';
import sinon from 'sinon';
import chaiPromised from 'chai-as-promised';
import { ArgumentError } from 'common-errors';
import createCapabilityActivationTask
  from '../../../src/bpmn/handlers/createCapabilityActivationTask';
chai.use(chaiPromised);

describe('bpmn/handlers/createCapabilityActivationTask', () => {
  it('throws ArgumentError when capabilitiesManagement is not provided', () => {
    const capabilityOptions = {};
    expect(() => createCapabilityActivationTask(null, capabilityOptions)).to.throw(ArgumentError);
  });
  describe('activateCapability', () => {
    it('returns null if it should not be activated', async () => {
      const capabilityOptions = {
        requirements: ['im.im-to-sms'],
        internal: 'im.im-to-sms',
        external: 'im',
      };
      const state = {
        results: {
          capabilities: ['call.onnet'],
          carrierId: '123',
        },
      };
      const inputProfile = [
        { capabilities: ['im'] },
        { capabilities: ['im.im-to-sms'] },
      ];
      const capabilitiesManagement = {};
      const activateCapability = createCapabilityActivationTask(capabilitiesManagement, capabilityOptions);
      inputProfile.forEach(async args => {
        await expect(activateCapability(state, args)).to.eventually.equal(null);
      });
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
