import _ from 'lodash';
import chai, { expect } from 'chai';
import { ValidationError, NotFoundError } from 'common-errors';
import chaiPromised from 'chai-as-promised';
import Promise from 'bluebird';

import { createTestContext } from '../test-context';
import { createPresetModel } from '../../src/services/models';
import { presetService as createPresetService } from '../../src/services';
import {
  ServiceType,
  PaymentMode,
  ChargeWallet,
  Capability,
} from '../../src/domain';

chai.use(chaiPromised);

function decorate(test) {
  return async () => {
    let connection;
    try {
      const context = await createTestContext();
      connection = context.connection;
      const Preset = createPresetModel(connection);
      const presetService = createPresetService(Preset);
      await Promise.try(() => test({
        Preset,
        presetService,
      }));
    } finally {
      await connection.closeAsync();
    }
  };
}

describe('services/presetService', () => {
  describe('setPreset', () => {
    it('throws validationError when required field is missing',
      decorate(async({ presetService, Preset }) => {
        const presetData = {
          presetId: 'preset id 0',
          serviceType: ServiceType.WHITE_LABEL,
          paymentMode: PaymentMode.PRE_PAID,
          chargeWallet: ChargeWallet.WALLET_END_USER,
          capabilities: [Capability.IM_TO_SMS, Capability.VSF],
          billing: {
            smsPackageId: 100,
            offnetPackageId: 101,
            currency: 840,
          },
          smsc: {
            needBilling: true,
            defaultRealm: 'defaultRealm',
            servicePlanId: 'servicePlanId',
            sourceAddress: 'sourceAddress',
          },
        };
        const presetKeys = ['presetId', 'billing', 'smsc'];
        for (const key of presetKeys) {
          await expect(presetService.setPreset(_.omit(presetData, key))).to.be.rejectedWith(ValidationError);
        }
        const presets = await Preset.find();
        expect(presets).to.be.empty;
      }));

    it('sets and creates preset',
      decorate(async({ Preset, presetService }) => {
        const presetData = {
          presetId: 'another preset id 1',
          serviceType: ServiceType.WHITE_LABEL,
          paymentMode: PaymentMode.POST_PAID,
          chargeWallet: ChargeWallet.WALLET_END_USER,
          capabilities: [Capability.IM_TO_SMS, Capability.VSF],
          billing: {
            smsPackageId: 100,
            offnetPackageId: 101,
            currency: 840,
          },
          smsc: {
            needBilling: true,
            defaultRealm: 'defaultRealm',
            servicePlanId: 'servicePlanId',
            sourceAddress: 'sourceAddress',
          },
        };
        const createdPreset = await presetService.setPreset(presetData);
        const preset = await Preset.findOne({ presetId: presetData.presetId });
        expect(createdPreset).to.deep.equal(preset.toJSON());
        const { createdAt, updatedAt, ...createdPresetDetails } = createdPreset;
        expect(createdPresetDetails).to.deep.equal(presetData);
        expect(createdAt).to.be.instanceof(Date);
        expect(updatedAt).to.deep.equal(createdAt);
      }));

    it('sets existing preset and updates the data in database',
      decorate(async({ Preset, presetService }) => {
        const presetData = {
          presetId: 'preset id 2',
          chargeWallet: ChargeWallet.WALLET_END_USER,
          capabilities: [],
          billing: {
            smsPackageId: 100,
            offnetPackageId: 101,
            currency: 840,
          },
          smsc: {
            needBilling: true,
            defaultRealm: 'defaultRealm',
            servicePlanId: 'servicePlanId',
            sourceAddress: 'sourceAddress',
          },
        };
        await Preset.create(presetData);
        const newPresetData = {
          ...presetData,
          capabilities: [Capability.IM_TO_SMS],
          chargeWallet: ChargeWallet.WALLET_COMPANY,
          billing: {
            smsPackageId: 200,
            offnetPackageId: 201,
            currency: 840,
          },
          smsc: {
            needBilling: false,
            defaultRealm: 'defaultRealm',
            servicePlanId: 'servicePlanId',
            sourceAddress: 'sourceAddress',
          },
        };
        const createdPreset = await presetService.setPreset(newPresetData);
        const presets = await Preset.find({ presetId: presetData.presetId });
        expect(presets).to.have.lengthOf(1);
        expect(createdPreset).to.deep.equal(presets[0].toJSON());
        const { createdAt, updatedAt, ...createdPresetDetails } = createdPreset;
        expect(createdPresetDetails).to.deep.equal(newPresetData);
        expect(createdAt).to.be.instanceof(Date);
        expect(updatedAt).to.be.instanceof(Date);
        expect(updatedAt).to.be.above(createdAt);
      }));
  });

  describe('getPreset', () => {
    it('throws Validation Error when presetId is missing',
      decorate(async({ presetService }) => {
        await expect(presetService.getPreset({ id: 'abc' })).to.be.rejectedWith(ValidationError);
        await expect(presetService.getPreset({ presetId: null })).to.be.rejectedWith(ValidationError);
      }));

    it('throws Not Found Error when getting non existing preset',
      decorate(async({ presetService }) => {
        const presetId = 'somePresetId';
        await expect(presetService.getPreset({ presetId })).to.be.rejectedWith(NotFoundError);
      }));

    it('gets preset', decorate(async({ presetService, Preset }) => {
      const presetData = {
        presetId: 'preset id 3',
        chargeWallet: ChargeWallet.WALLET_END_USER,
        capabilities: [],
        billing: {
          smsPackageId: 100,
          offnetPackageId: 101,
          currency: 840,
        },
        smsc: {
          needBilling: true,
          defaultRealm: 'defaultRealm',
          servicePlanId: 'servicePlanId',
          sourceAddress: 'sourceAddress',
        },
      };
      await new Preset(presetData).save();
      const preset = await presetService.getPreset({ presetId: presetData.presetId });
      expect(_.omit(preset, 'createdAt', 'updatedAt')).to.deep.equal(presetData);
    }));
  });
});
