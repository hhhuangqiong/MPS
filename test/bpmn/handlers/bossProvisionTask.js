import { expect } from 'chai';
import sinon from 'sinon';
import { ArgumentError, ReferenceError } from 'common-errors';
import { Capability, ChargeWallet } from '../../../src/domain';
import { createBossProvisionTask, bpmnEvents } from '../../../src/bpmn';

describe('bpmn/handlers/bossProvisionTask', () => {
  it('throws ArgumentError when any dependency is not provided', () => {
    const templateService = {};
    const bossProvisionManagement = {};
    const capabilitiesManagement = {};
    expect(() => createBossProvisionTask(null, bossProvisionManagement, capabilitiesManagement))
      .to.throw(ArgumentError);
    expect(() => createBossProvisionTask(templateService, null, capabilitiesManagement))
      .to.throw(ArgumentError);
    expect(() => createBossProvisionTask(templateService, bossProvisionManagement, null)).to.throw(ArgumentError);
  });
  it('returns a function which name is BOSS_PROVISION', () => {
    const templateService = {};
    const bossProvisionManagement = {};
    const capabilitiesManagement = {};
    const result = createBossProvisionTask(templateService, bossProvisionManagement, capabilitiesManagement);
    expect(result.$meta.name).to.equal(bpmnEvents.BOSS_PROVISION);
  });
  describe('provisionBoss', () => {
    it('early returns when state already contains bossProvisionId', async () => {
      const state = {
        results: {
          bossProvisionId: '122333',
        },
      };
      const res = {};
      const capabilitiesManagement = {
        getProfile: sinon.stub().returns(res),
      };
      const profile = {};
      const templateService = {};
      const bossProvisionManagement = {};
      const provisionBossTask =
      createBossProvisionTask(templateService, bossProvisionManagement, capabilitiesManagement);
      await provisionBossTask(state, profile);
      expect(capabilitiesManagement.getProfile.called).to.be.false;
    });
    it('early returns when it is not using company wallet', async () => {
      const state = {
        results: {
          bossProvisionId: '122333',
        },
      };
      const res = {};
      const capabilitiesManagement = {
        getProfile: sinon.stub().returns(res),
      };
      const profile = {
        chargeWallet: ChargeWallet.WALLET_NONE,
        billing: { smsPackageId: 0, offnetPackageId: 0, currency: 0 },
      };
      const templateService = {};
      const bossProvisionManagement = {};
      const provisionBossTask =
      createBossProvisionTask(templateService, bossProvisionManagement, capabilitiesManagement);
      await provisionBossTask(state, profile);
      expect(capabilitiesManagement.getProfile.called).to.be.false;
    });
    it('throws ArgumentError when carrierId is empty in state', async () => {
      const state = {
        results: {
          carrierId: null,
        },
      };
      const profile = {
        chargeWallet: ChargeWallet.WALLET_COMPANY,
        billing: { smsPackageId: 0, offnetPackageId: 0, currency: 0 },
      };
      const templateService = {};
      const bossProvisionManagement = {};
      const capabilitiesManagement = {};
      const provisionBossTask =
        createBossProvisionTask(templateService, bossProvisionManagement, capabilitiesManagement);
      let errorThrown = false;
      try {
        await provisionBossTask(state, profile);
      } catch (err) {
        expect(err).to.be.instanceOf(ArgumentError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });
    it('throws ArgumentError when it contains im_to_sms capability without sms package id', async () => {
      const state = {
        results: {
          carrierId: 'test',
        },
      };
      const profile = {
        chargeWallet: ChargeWallet.WALLET_COMPANY,
        billing: { smsPackageId: null, offnetPackageId: 0, currency: 0 },
        capabilities: [Capability.IM_TO_SMS],
        smsc: {
          needBilling: true,
        },
      };
      const templateService = {};
      const bossProvisionManagement = {};
      const capabilitiesManagement = {};
      const provisionBossTask =
        createBossProvisionTask(templateService, bossProvisionManagement, capabilitiesManagement);
      let errorThrown = false;
      try {
        await provisionBossTask(state, profile);
      } catch (err) {
        expect(err).to.be.instanceOf(ArgumentError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });
    it('throws ArgumentError when it contains offnet capability without offnet package id ', async () => {
      const state = {
        results: {
          carrierId: 'test',
        },
      };
      const profile = {
        chargeWallet: ChargeWallet.WALLET_COMPANY,
        billing: { smsPackageId: 0, offnetPackageId: null, currency: 0 },
        capabilities: [Capability.CALL_OFFNET],
        smsc: {
          needBilling: true,
        },
      };
      const templateService = {};
      const bossProvisionManagement = {};
      const capabilitiesManagement = {};
      const provisionBossTask =
        createBossProvisionTask(templateService, bossProvisionManagement, capabilitiesManagement);
      let errorThrown = false;
      try {
        await provisionBossTask(state, profile);
      } catch (err) {
        expect(err).to.be.instanceOf(ArgumentError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });
    it('throws ReferenceError when offnet_incoming_call_prefix is missing in voice profile', async () => {
      const state = {
        results: {
          carrierId: 'test',
        },
      };
      const profile = {
        chargeWallet: ChargeWallet.WALLET_COMPANY,
        billing: { smsPackageId: 0, offnetPackageId: 1, currency: 0 },
        capabilities: [Capability.CALL_OFFNET],
        smsc: {
          needBilling: true,
        },
      };
      const res = {
        body: {
          offnet_incoming_call_prefix: null,
        },
      };
      const templateService = {};
      const bossProvisionManagement = {};
      const capabilitiesManagement = {
        getProfile: sinon.stub().returns(res),
      };
      const provisionBossTask =
        createBossProvisionTask(templateService, bossProvisionManagement, capabilitiesManagement);
      let errorThrown = false;
      try {
        await provisionBossTask(state, profile);
        expect(capabilitiesManagement.getProfile).to.be.true;
      } catch (err) {
        expect(err).to.be.instanceOf(ReferenceError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });
    it('throws ReferenceError when offnet_outgoing_call_prefix is missing in voice profile', async () => {
      const state = {
        results: {
          carrierId: 'test',
        },
      };
      const profile = {
        chargeWallet: ChargeWallet.WALLET_COMPANY,
        billing: { smsPackageId: 0, offnetPackageId: 1, currency: 0 },
        capabilities: [Capability.CALL_OFFNET],
        smsc: {
          needBilling: true,
        },
      };
      const res = {
        body: {
          offnet_incoming_call_prefix: '00852',
          offnet_outgoing_call_prefix: null,
        },
      };
      const templateService = {};
      const bossProvisionManagement = {};
      const capabilitiesManagement = {
        getProfile: sinon.stub().returns(res),
      };
      const provisionBossTask =
        createBossProvisionTask(templateService, bossProvisionManagement, capabilitiesManagement);
      let errorThrown = false;
      try {
        await provisionBossTask(state, profile);
        expect(capabilitiesManagement.getProfile).to.be.true;
      } catch (err) {
        expect(err).to.be.instanceOf(ReferenceError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });
    it('throws ReferenceError when bossProvisionId is missing from the boss server', async () => {
      const state = {
        results: {
          carrierId: 'test',
          smsPrefix: '00853',
        },
      };
      const profile = {
        chargeWallet: ChargeWallet.WALLET_COMPANY,
        billing: { smsPackageId: 10, offnetPackageId: 1, currency: 0 },
        capabilities: [Capability.IM_TO_SMS],
        smsc: {
          needBilling: true,
        },
        companyCode: 'test172',
        companyInfo: { name: 'hhhertre', timezone: 'Dateline Standard Time' },
        country: 'AF',
        serviceType: 'SDK',
        paymentMode: 'PRE_PAID',
        resellerCompanyId: '5799e2b58149bef30dd10c7b',
        resellerCarrierId: 'sparkle.maaiii.org',
      };
      const resProfile = {
        body: {
          offnet_incoming_call_prefix: '00852',
          offnet_outgoing_call_prefix: '00853',
        },
      };
      const resBossTemplate = {
        prePaidInitialBalance: 0,
        postPaidInitialBalance: 999999999,
      };
      const resProvision = {
        body: { id: null, success: true },
      };
      const templateService = {
        get: sinon.stub().returns(resBossTemplate),
      };
      const bossProvisionManagement = {
        create: sinon.stub().returns(resProvision),
      };
      const capabilitiesManagement = {
        getProfile: sinon.stub().returns(resProfile),
      };
      const provisionBossTask =
        createBossProvisionTask(templateService, bossProvisionManagement, capabilitiesManagement);
      let errorThrown = false;
      try {
        await provisionBossTask(state, profile);
        expect(templateService.get.calledOnce).to.be.true;
        expect(bossProvisionManagement.create.calledOnce).to.be.true;
        expect(capabilitiesManagement.getProfile.calledOnce).to.be.true;
      } catch (err) {
        expect(err).to.be.instanceOf(ReferenceError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });
    it('throws ReferenceError when success is not true from boss server', async () => {
      const state = {
        results: {
          carrierId: 'test',
          smsPrefix: '00853',
        },
      };
      const profile = {
        chargeWallet: ChargeWallet.WALLET_COMPANY,
        billing: { smsPackageId: 10, offnetPackageId: 1, currency: 0 },
        capabilities: [Capability.CALL_OFFNET, Capability.IM_TO_SMS],
        smsc: {
          needBilling: false,
        },
        companyCode: 'test172',
        companyInfo: { name: 'hhhertre', timezone: 'Dateline Standard Time' },
        country: 'AF',
        serviceType: 'SDK',
        paymentMode: 'POST_PAID',
        resellerCompanyId: '5799e2b58149bef30dd10c7b',
        resellerCarrierId: 'sparkle.maaiii.org',
      };
      const resProfile = {
        body: {
          offnet_incoming_call_prefix: '00852',
          offnet_outgoing_call_prefix: '00853',
        },
      };
      const resBossTemplate = {
        prePaidInitialBalance: 0,
        postPaidInitialBalance: 999999999,
      };
      const resProvision = {
        body: { id: '111111', success: false },
      };
      const templateService = {
        get: sinon.stub().returns(resBossTemplate),
      };
      const bossProvisionManagement = {
        create: sinon.stub().returns(resProvision),
      };
      const capabilitiesManagement = {
        getProfile: sinon.stub().returns(resProfile),
      };
      const provisionBossTask =
        createBossProvisionTask(templateService, bossProvisionManagement, capabilitiesManagement);
      let errorThrown = false;
      try {
        await provisionBossTask(state, profile);
        expect(templateService.get.calledOnce).to.be.true;
        expect(bossProvisionManagement.create.calledOnce).to.be.true;
        expect(capabilitiesManagement.getProfile.calledOnce).to.be.true;
      } catch (err) {
        expect(err).to.be.instanceOf(ReferenceError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });
    it('returns boss provision id when provisioning boss successfully', async () => {
      const state = {
        results: {
          carrierId: 'test',
          smsPrefix: '00853',
        },
      };
      const profile = {
        chargeWallet: ChargeWallet.WALLET_COMPANY,
        billing: { smsPackageId: 10, offnetPackageId: 1, currency: 0 },
        capabilities: [Capability.CALL_OFFNET, Capability.IM_TO_SMS],
        smsc: {
          needBilling: false,
        },
        companyCode: 'test172',
        companyInfo: { name: 'hhhertre', timezone: 'Dateline Standard Time' },
        country: 'AF',
        serviceType: 'SDK',
        paymentMode: 'POST_PAID',
        resellerCompanyId: '5799e2b58149bef30dd10c7b',
        resellerCarrierId: 'sparkle.maaiii.org',
      };
      const resProfile = {
        body: {
          offnet_incoming_call_prefix: '00852',
          offnet_outgoing_call_prefix: '00853',
        },
      };
      const resBossTemplate = {
        prePaidInitialBalance: 0,
        postPaidInitialBalance: 999999999,
      };
      const resProvision = {
        body: { id: '111111', success: true },
      };
      const templateService = {
        get: sinon.stub().returns(resBossTemplate),
      };
      const bossProvisionManagement = {
        create: sinon.stub().returns(resProvision),
      };
      const capabilitiesManagement = {
        getProfile: sinon.stub().returns(resProfile),
      };
      const provisionBossTask =
      createBossProvisionTask(templateService, bossProvisionManagement, capabilitiesManagement);
      const result = await provisionBossTask(state, profile);
      expect(templateService.get.calledOnce).to.be.true;
      expect(bossProvisionManagement.create.calledOnce).to.be.true;
      expect(capabilitiesManagement.getProfile.calledOnce).to.be.true;
      expect(result.results.bossProvisionId).to.be.equal(resProvision.body.id);
    });
  });
});
