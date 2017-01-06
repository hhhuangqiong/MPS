import chai, { expect } from 'chai';
import sinon from 'sinon';
import chaiPromised from 'chai-as-promised';
import { ArgumentError, ArgumentNullError } from 'common-errors';
import createSmsProfileCapabilityActivationTask from '../../../src/bpmn/handlers/createSmsProfileCapabilityActivationTask';

chai.use(chaiPromised);

describe('bpmn/handlers/createCapabilityActivationTask', () => {
  it('throws ArgumentError when any of dependencies is not provided', () => {
    const templateService = {};
    const capabilitiesManagement = {};
    const input = [
     [null, capabilitiesManagement],
     [templateService, null],
    ];
    input.forEach(args => {
      expect(() => createSmsProfileCapabilityActivationTask(...args)).to.throw(ArgumentError);
    });
  });
  describe('activateCapability', () => {
    it('returns null if it already be activated', async () => {
      const capabilityOptions = {
        requirements: ['im.im-to-sms'],
        internal: 'call.onnet',
        external: 'im',
        templateKey: 'abc',
      };
      const profile = {
        smsc: null,
      };
      const state = {
        results: {
          capabilities: ['call.onnet'],
          carrierId: '123',
        },
      };
      const templateService = {};
      const capabilitiesManagement = {};
      const activateCapability = createSmsProfileCapabilityActivationTask(
        templateService, capabilitiesManagement, capabilityOptions);
      await expect(activateCapability(state, profile)).to.eventually.be.null;
    });
    it('returns null if it should not be activated', async () => {
      const capabilityOptions = {
        requirements: ['im.im-to-sms'],
        internal: 'call.onnet',
        external: 'im',
        templateKey: 'abc',
      };
      const profile = {
        smsc: null,
        capabilities: ['call.onnet'],
      };
      const state = {
        results: {
          capabilities: ['im.im-to-sms'],
          carrierId: '123',
        },
      };
      const templateService = {};
      const capabilitiesManagement = {};
      const activateCapability = createSmsProfileCapabilityActivationTask(
        templateService, capabilitiesManagement, capabilityOptions);
      await expect(activateCapability(state, profile)).to.eventually.be.null;
    });
    it('throws ArgumentError when smsc is empty in profile', async () => {
      const capabilityOptions = {
        requirements: ['im.im-to-sms'],
        internal: 'call.onnet',
        external: 'im',
        templateKey: 'abc',
      };
      const profile = {
        smsc: null,
        capabilities: ['im.im-to-sms'],
      };
      const state = {
        results: {
          capabilities: ['im.im-to-sms'],
          carrierId: '123',
          smsRealmId: 'abc',
          smsServicePlanId: 'abcd',
        },
      };
      const resChargeProfile = {
        company: 'm800',
        user: 'user',
      };
      const resSmsProfile = {};
      const templateService = {
        get: sinon.stub().returns(resChargeProfile),
        render: sinon.stub().returns(resSmsProfile),
      };

      const capabilitiesManagement = {};
      const activateCapability = createSmsProfileCapabilityActivationTask(
      templateService, capabilitiesManagement, capabilityOptions);
      await expect(activateCapability(state, profile)).to.be.rejectedWith(ArgumentNullError);
      expect(templateService.get.calledOnce).to.be.true;
      expect(templateService.render.calledOnce).to.be.true;
    });
    it('throws ReferenceError when smsProfileId is empty in response body', async () => {
      const capabilityOptions = {
        requirements: ['im.im-to-sms'],
        internal: 'call.onnet',
        external: 'im',
        templateKey: 'abc',
      };
      const profile = {
        smsc: {
          defaultRealm: 'hk',
          servicePlanId: '123',
          sourceAddress: 'hk',
        },
        capabilities: ['im.im-to-sms'],
      };
      const state = {
        results: {
          capabilities: ['im.im-to-sms'],
          carrierId: '123',
          smsRealmId: 'abc',
          smsServicePlanId: 'abcd',
        },
      };
      const resChargeProfile = {
        company: 'm800',
        user: 'user',
      };
      const resSmsProfile = {};
      const templateService = {
        get: sinon.stub().returns(resChargeProfile),
        render: sinon.stub().returns(resSmsProfile),
      };
      const res = {
        body: {
          id: null,
        },
      };
      const capabilitiesManagement = {
        enableSmsProfileCapability: sinon.stub().returns(res),
      };
      const activateCapability = createSmsProfileCapabilityActivationTask(
      templateService, capabilitiesManagement, capabilityOptions);
      await expect(activateCapability(state, profile)).to.be.rejectedWith(ReferenceError);
      expect(templateService.get.calledOnce).to.be.true;
      expect(templateService.render.calledOnce).to.be.true;
      expect(capabilitiesManagement.enableSmsProfileCapability.calledOnce).to.be.true;
    });
    it('returns smsProfileId and capabilities when the taks is finished', async () => {
      const capabilityOptions = {
        requirements: ['im.im-to-sms'],
        internal: 'call.onnet',
        external: 'im',
        templateKey: 'abc',
      };
      const profile = {
        smsc: {
          defaultRealm: 'hk',
          servicePlanId: '123',
          sourceAddress: 'hk',
        },
        capabilities: ['im.im-to-sms'],
      };
      const state = {
        results: {
          capabilities: ['im.im-to-sms'],
          carrierId: '123',
          smsRealmId: 'abc',
          smsServicePlanId: 'abcd',
        },
      };
      const resChargeProfile = {
        company: 'm800',
        user: 'user',
      };
      const resSmsProfile = {};
      const templateService = {
        get: sinon.stub().returns(resChargeProfile),
        render: sinon.stub().returns(resSmsProfile),
      };
      const res = {
        body: {
          id: 'abc',
        },
      };
      const capabilitiesManagement = {
        enableSmsProfileCapability: sinon.stub().returns(res),
      };
      const activateCapability = createSmsProfileCapabilityActivationTask(
      templateService, capabilitiesManagement, capabilityOptions);
      const result = await activateCapability(state, profile);
      expect(result.results.smsProfileId).to.be.equal(res.body.id);
      expect(result.results.capabilities).to.be.eql(['im.im-to-sms', 'call.onnet']);
      expect(templateService.get.calledOnce).to.be.true;
      expect(templateService.render.calledOnce).to.be.true;
      expect(capabilitiesManagement.enableSmsProfileCapability.calledOnce).to.be.true;
    });
  });
});
