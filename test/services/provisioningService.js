import _ from 'lodash';
import chai, { expect } from 'chai';
import { ValidationError, InvalidOperationError } from 'common-errors';
import chaiPromised from 'chai-as-promised';
import sinon from 'sinon';
import mongoose from 'mongoose';
import Promise from 'bluebird';

import { createTestContext } from '../test-context';
import { createProvisioningModel } from '../../src/services/models';
import { provisioningService as createProvisioningService } from '../../src/services';
import {
  ServiceType,
  PaymentMode,
  ChargeWallet,
  Capability,
  PROVISIONING_EVENT,
  ProcessStatus,
} from '../../src/domain';

chai.use(chaiPromised);

function decorate(test) {
  return async () => {
    let connection;
    try {
      const context = await createTestContext();
      connection = context.connection;
      const eventBus = {
        emit: sinon.stub(),
      };
      const Provisioning = createProvisioningModel(connection);
      const provisioningService = createProvisioningService(context.logger, Provisioning, eventBus);
      await Promise.try(() => test({
        Provisioning,
        provisioningService,
        eventBus,
      }));
    } finally {
      await connection.closeAsync();
    }
  };
}

describe('services/provisioningService', () => {
  describe('createProvisioning', () => {
    it('throws validationError when required field is missing',
    decorate(async({ provisioningService, eventBus }) => {
      const provisioningData = {
        companyInfo: {
          name: 'newCompany',
          timezone: 'timezone',
        },
        country: 'Hong Kong',
        companyCode: 'mycompanycode',
        serviceType: ServiceType.WHITE_LABEL,
        resellerCompanyId: '5799e2b58149bef30dd10c72',
        resellerCarrierId: 'resellerCarierId',
        capabilities: [Capability.IM_TO_SMS, Capability.CALL_OFFNET],
        paymentMode: PaymentMode.POST_PAID,
        chargeWallet: ChargeWallet.WALLET_END_USER,
        billing: {
          smsPackageId: 10080,
          offnetPackageId: 10081,
          currency: 840,
        },
        smsc: {
          needBilling: true,
          defaultRealm: 'defaultRealm',
          servicePlanId: 'servicePlanId',
          sourceAddress: '192.168.0.1',
          realm: {
            systemId: 'systemId',
            password: 'password',
            bindingDetails: [{
              ip: '192.168.1.1',
              port: 8080,
            }],
          },
        },
      };
      const provisioningDataKey = Object.keys(provisioningData);
      for (const key of provisioningDataKey) {
        await expect(provisioningService.createProvisioning(_.omit(provisioningData, key))).to.be.rejected;
      }
      expect(eventBus.emit.called).to.be.false;
    }));

    it('creates provisioning and emit the provision event',
      decorate(async({ provisioningService, Provisioning, eventBus }) => {
        const provisioningData = {
          companyInfo: {
            name: 'newCompany',
            timezone: 'timezone',
          },
          country: 'Hong Kong',
          companyCode: 'mycompanycode',
          serviceType: ServiceType.WHITE_LABEL,
          resellerCompanyId: '5799e2b58149bef30dd10c72',
          resellerCarrierId: 'resellerCarierId',
          capabilities: [Capability.IM_TO_SMS, Capability.CALL_OFFNET],
          paymentMode: PaymentMode.POST_PAID,
          chargeWallet: ChargeWallet.WALLET_END_USER,
          billing: {
            smsPackageId: 10080,
            offnetPackageId: 10081,
            currency: 840,
          },
          smsc: {
            needBilling: true,
            defaultRealm: 'defaultRealm',
            servicePlanId: 'servicePlanId',
            sourceAddress: '192.168.0.1',
            realm: {
              systemId: 'systemId',
              password: 'password',
              bindingDetails: [{
                ip: '192.168.1.1',
                port: 8080,
              }],
            },
          },
        };
        const createdProvisioning = await provisioningService.createProvisioning(provisioningData);
        expect(eventBus.emit.calledOnce).to.be.true;
        const { createdAt, updatedAt, profile: createdProvisioningProfile } = createdProvisioning;
        const [provisioningId, provisioningEvent] = eventBus.emit.args[0];
        expect(provisioningId).to.equal(PROVISIONING_EVENT.PROVISIONING_START_REQUESTED);
        expect(provisioningEvent.provisioningId).to.equal(createdProvisioning.id);
        expect(createdProvisioningProfile.companyInfo).to.deep.equal(provisioningData.companyInfo);

        const provisioningRecord = await Provisioning.findById(createdProvisioning.id);
        const { processId, ... restProvisioningRecord } = provisioningRecord.toJSON();
        expect(provisioningEvent.processId).to.equal(processId);
        expect(restProvisioningRecord).to.deep.equal(createdProvisioning);
        expect(createdAt).to.be.instanceof(Date);
        // it will change the status after created when create provisioning
        // so updatedAt will be larger than createdAt
        expect(updatedAt).to.be.above(createdAt);
        expect(createdProvisioning.status).to.equal(ProcessStatus.IN_PROGRESS);
      }));
  });

  describe('getProvisioning', () => {
    it('returns null when provisioning id not exist',
      decorate(async({ provisioningService }) => {
        const nonExistingId = '57ea5b1ce9582cf6e54cfdb1';
        const provisioningResult = await provisioningService.getProvisioning({ provisioningId: nonExistingId });
        expect(provisioningResult).to.be.null;
      }));

    it('throws Validation Error if provisioning id is not in correct format',
      decorate(async({ provisioningService }) => {
        await expect(provisioningService.getProvisioning({ provisioningId: 'wrongFormat' })).to.be.rejectedWith(ValidationError);
      }));

    it('returns the provisioning when provisioning id exist',
      decorate(async({ provisioningService, Provisioning }) => {
        const provisioningData = {
          _id: '57ea5b1ce9582cf6e54cfdb3',
          status: ProcessStatus.COMPLETE,
          profile: {
            paymentMode: PaymentMode.PRE_PAID,
            resellerCarrierId: 'sparkle.maaiii.org',
            resellerCompanyId: '579f0a9281ca6d7eb32d0dd1',
            country: 'AF',
            companyCode: 'web364',
            chargeWallet: ChargeWallet.WALLET_COMPANY,
            serviceType: ServiceType.WHITE_LABEL,
            smsc: {
              sourceAddress: '5001000112',
              needBilling: true,
              servicePlanId: 'whitelabel',
              defaultRealm: 'AliceTest',
            },
            billing: {
              currency: 840,
              offnetPackageId: 5281,
              smsPackageId: 5282,
            },
            capabilities: [
              'im',
              'im.im-to-sms',
            ],
            companyInfo: {
              timezone: 'Dateline Standard Time',
              name: 'sampleCompany',
            },
            companyId: '5851286c3943a40001ef41f9',
            carrierId: 'web364.wl.maaiii.org',
          },
          taskErrors: [],
        };
        await Provisioning.create(provisioningData);
        const provisioningResult = await provisioningService.getProvisioning({ provisioningId: provisioningData._id });
        expect(provisioningResult.id).to.equal(provisioningData._id);
        expect(_.omit(provisioningResult, 'id', 'createdAt', 'updatedAt')).to.deep.equal(_.omit(provisioningData, '_id'));
      }));
  });

  describe('getProvisionings', () => {
    it('returns empty list when no data',
      decorate(async({ provisioningService }) => {
        const provisioningList = await provisioningService.getProvisionings();
        expect(provisioningList.total).to.equal(0);
      }));

    it('returns provisioning and with page parameters',
        decorate(async({ provisioningService, Provisioning }) => {
          const provisioningData = {
            status: ProcessStatus.COMPLETE,
            profile: {
              paymentMode: PaymentMode.PRE_PAID,
              resellerCarrierId: 'sparkle.maaiii.org',
              resellerCompanyId: '579f0a9281ca6d7eb32d0dd1',
              country: 'AF',
              chargeWallet: ChargeWallet.WALLET_COMPANY,
              serviceType: ServiceType.WHITE_LABEL,
              smsc: {
                sourceAddress: '5001000112',
                needBilling: true,
                servicePlanId: 'whitelabel',
                defaultRealm: 'AliceTest',
              },
              billing: {
                currency: 840,
                offnetPackageId: 5281,
                smsPackageId: 5282,
              },
              capabilities: [
                'im',
                'im.im-to-sms',
              ],
              companyInfo: {
                timezone: 'Dateline Standard Time',
                name: 'sampleCompany',
              },
              companyId: '5851286c3943a40001ef41f9',
              carrierId: 'web364.wl.maaiii.org',
            },
            taskErrors: [],
          };
          const numberOfRecord = 25;
          const provisioningRecords = _.range(1, numberOfRecord).map(index => ({
            ...provisioningData,
            profile: {
              ...provisioningData.profile,
              companyCode: `web_${index}`,
              // to generate the object id
              companyId: mongoose.Types.ObjectId().toString(),
            },
          }));
          await Provisioning.create(provisioningRecords);
          const provisioningList = await provisioningService.getProvisionings();
          expect(provisioningList.total).to.be.equal(provisioningRecords.length);
          expect(provisioningList.items).to.have.lengthOf(provisioningList.pageSize);

          provisioningList.items.forEach(item => {
            expect(item).to.contain.all.keys(provisioningData);
          });

          const pageParam = [{
            input: {
              page: 3,
            },
            output: {
              page: 3,
              itemsLength: provisioningRecords.length % provisioningList.pageSize,
            },
          }, {
            input: {
              pageSize: provisioningRecords.length,
            },
            output: {
              page: 1,
              itemsLength: provisioningRecords.length,
            },
          }, {
            input: {
              pageSize: 5,
              page: 2,
            },
            output: {
              page: 2,
              itemsLength: 5,
            },
          }];

          for (const { input, output } of pageParam) {
            const provisioningsList = await provisioningService.getProvisionings(input);
            expect(provisioningsList.items).to.have.lengthOf(output.itemsLength);
            expect(provisioningsList.page).to.equal(output.page);
            expect(provisioningsList.total).to.equal(provisioningRecords.length);
          }
        }));

    it('returns provisioning and with filter',
      decorate(async({ Provisioning, provisioningService }) => {
        const provisioningCompleteData = {
          status: ProcessStatus.COMPLETE,
          profile: {
            paymentMode: PaymentMode.PRE_PAID,
            resellerCarrierId: 'sparkle.maaiii.org',
            resellerCompanyId: '579f0a9281ca6d7eb32d0dd1',
            country: 'AF',
            chargeWallet: ChargeWallet.WALLET_COMPANY,
            serviceType: ServiceType.WHITE_LABEL,
            smsc: {
              sourceAddress: '5001000112',
              needBilling: true,
              servicePlanId: 'whitelabel',
              defaultRealm: 'AliceTest',
            },
            billing: {
              currency: 840,
              offnetPackageId: 5281,
              smsPackageId: 5282,
            },
            capabilities: [
              'im',
              'im.im-to-sms',
            ],
            companyInfo: {
              timezone: 'Dateline Standard Time',
              name: 'sampleCompany',
            },
            companyId: '5851286c3943a40001ef41f9',
            companyCode: 'provisioncomplete',
            carrierId: 'provisioncomplete.wl.maaiii.org',
          },
          taskErrors: [],
        };
        const provisioningErrorData = {
          ...provisioningCompleteData,
          profile: {
            ...provisioningCompleteData.profile,
            companyId: '5851286c3943a40001ef41f7',
            companyCode: 'provisionerror',
            carrierId: 'provisionerror.wl.maaiii.org',
          },
          status: 'ERROR',
        };
        const provisioningRecords = [provisioningErrorData, provisioningCompleteData];
        await Provisioning.create(provisioningRecords);

        const resultWithStatusFilter = await provisioningService.getProvisionings({ status: ProcessStatus.ERROR });
        expect(resultWithStatusFilter.items).to.have.lengthOf(1);
        expect(resultWithStatusFilter.items[0].profile.carrierId).to.equal(provisioningErrorData.profile.carrierId);
        expect(resultWithStatusFilter.items[0].status).to.equal(ProcessStatus.ERROR);

        const noResultWithStatusFilter = await provisioningService.getProvisionings({ status: ProcessStatus.CREATED });
        expect(noResultWithStatusFilter.items).to.have.lengthOf(0);

        const resultWithCarrierIdFilter = await provisioningService.getProvisionings({
          'profile.carrierId': provisioningCompleteData.profile.carrierId,
        });
        expect(resultWithCarrierIdFilter.items).to.have.lengthOf(1);
        expect(resultWithCarrierIdFilter.items[0].profile.carrierId).to.equal(provisioningCompleteData.profile.carrierId);

        const noResultWithCarrierIdFilter = await provisioningService.getProvisionings({
          'profile.carrierId': 'nonExistingCarrierId',
        });
        expect(noResultWithCarrierIdFilter.items).to.have.lengthOf(0);

        const resultWithServiceTypeFilter = await provisioningService.getProvisionings({
          'profile.serviceType': ServiceType.WHITE_LABEL,
        });
        expect(resultWithServiceTypeFilter.items).to.have.lengthOf(2);

        const noResultWithServiceTypeFilter = await provisioningService.getProvisionings({
          'profile.serviceType': ServiceType.SDK,
        });
        expect(noResultWithServiceTypeFilter.items).to.have.lengthOf(0);
      }));

    it('returns provisioning when search is passed',
      decorate(async({ Provisioning, provisioningService }) => {
        const provisioningData = {
          status: ProcessStatus.COMPLETE,
          profile: {
            paymentMode: PaymentMode.PRE_PAID,
            resellerCarrierId: 'sparkle.maaiii.org',
            resellerCompanyId: '579f0a9281ca6d7eb32d0dd1',
            country: 'AF',
            chargeWallet: ChargeWallet.WALLET_COMPANY,
            serviceType: ServiceType.WHITE_LABEL,
            smsc: {
              sourceAddress: '5001000112',
              needBilling: true,
              servicePlanId: 'whitelabel',
              defaultRealm: 'AliceTest',
            },
            billing: {
              currency: 840,
              offnetPackageId: 5281,
              smsPackageId: 5282,
            },
            capabilities: [
              'im',
              'im.im-to-sms',
            ],
            companyInfo: {
              timezone: 'Dateline Standard Time',
              name: 'sampleCompany',
            },
            companyId: '5851286c3943a40001ef41f9',
            companyCode: 'provisioncomplete',
            carrierId: 'provisioncomplete.wl.maaiii.org',
          },
          taskErrors: [],
        };
        await Provisioning.create(provisioningData);
        const result = await provisioningService.getProvisionings({ search: 'provision' });
        expect(result.items).to.have.lengthOf(1);

        const noResult = await provisioningService.getProvisionings({ search: 'noprovision' });
        expect(noResult.items).to.have.lengthOf(0);
      }));
  });

  describe('updateProvisoning', () => {
    it('update existing provisioning',
      decorate(async ({ Provisioning, provisioningService, eventBus }) => {
        const provisioningData = {
          _id: '57ea5b1ce9582cf6e54cfdb1',
          status: ProcessStatus.COMPLETE,
          profile: {
            paymentMode: PaymentMode.PRE_PAID,
            resellerCarrierId: 'sparkle.maaiii.org',
            resellerCompanyId: '579f0a9281ca6d7eb32d0dd1',
            country: 'AF',
            chargeWallet: ChargeWallet.WALLET_COMPANY,
            serviceType: ServiceType.WHITE_LABEL,
            smsc: {
              sourceAddress: '5001000112',
              needBilling: true,
              servicePlanId: 'whitelabel',
              defaultRealm: 'AliceTest',
            },
            billing: {
              currency: 840,
              offnetPackageId: 5281,
              smsPackageId: 5282,
            },
            capabilities: [
              'im',
              'im.im-to-sms',
            ],
            companyInfo: {
              timezone: 'Dateline Standard Time',
              name: 'sampleCompany',
            },
            companyId: '5851286c3943a40001ef41f9',
            companyCode: 'provisioncomplete',
            carrierId: 'provisioncomplete.wl.maaiii.org',
          },
          taskErrors: [],
        };
        await Provisioning.create(provisioningData);
        const newInfo = {
          provisioningId: provisioningData._id,
          profile: {
            paymentMode: PaymentMode.POST_PAID,
            country: 'Hong Kong',
          },
        };
        await provisioningService.updateProvisioning(newInfo);
        const provisioningProfile = await Provisioning.findById(provisioningData._id);
        expect(provisioningProfile.profile.paymentMode).to.equal(newInfo.profile.paymentMode);
        expect(provisioningProfile.profile.country).to.equal(newInfo.profile.country);
        expect(eventBus.emit.calledOnce).to.be.true;
        const [eventName, eventDetails] = eventBus.emit.args[0];
        expect(eventName).to.equal(PROVISIONING_EVENT.PROVISIONING_START_REQUESTED);
        expect(eventDetails.provisioningId).to.equal(provisioningData._id);
      }));

    it('throws invalid operation error when current provisioning record is not COMPLETE or ERROR',
      decorate(async ({ Provisioning, provisioningService }) => {
        const provisioningData = {
          _id: '57ea5b1ce9582cf6e54cfdb1',
          status: ProcessStatus.CREATED,
          profile: {
            paymentMode: PaymentMode.PRE_PAID,
            resellerCarrierId: 'sparkle.maaiii.org',
            resellerCompanyId: '579f0a9281ca6d7eb32d0dd1',
            country: 'AF',
            chargeWallet: ChargeWallet.WALLET_COMPANY,
            serviceType: ServiceType.WHITE_LABEL,
            smsc: {
              sourceAddress: '5001000112',
              needBilling: true,
              servicePlanId: 'whitelabel',
              defaultRealm: 'AliceTest',
            },
            billing: {
              currency: 840,
              offnetPackageId: 5281,
              smsPackageId: 5282,
            },
            capabilities: [
              'im',
              'im.im-to-sms',
            ],
            companyInfo: {
              timezone: 'Dateline Standard Time',
              name: 'sampleCompany',
            },
            companyId: '5851286c3943a40001ef41f9',
            companyCode: 'provisioncomplete',
            carrierId: 'provisioncomplete.wl.maaiii.org',
          },
          taskErrors: [],
        };
        await Provisioning.create(provisioningData);
        const newInfo = {
          provisioningId: provisioningData._id,
          profile: {
            country: 'Hong Kong',
          },
        };
        await expect(provisioningService.updateProvisioning(newInfo)).to.be.rejectedWith(InvalidOperationError);
      }));

    it('throws validation error when update unchangeable fields',
      decorate(async ({ Provisioning, provisioningService }) => {
        const provisioningData = {
          _id: '57ea5b1ce9582cf6e54cfdb1',
          status: ProcessStatus.COMPLETE,
          profile: {
            paymentMode: PaymentMode.PRE_PAID,
            resellerCarrierId: 'sparkle.maaiii.org',
            resellerCompanyId: '579f0a9281ca6d7eb32d0dd1',
            country: 'AF',
            chargeWallet: ChargeWallet.WALLET_COMPANY,
            serviceType: ServiceType.WHITE_LABEL,
            smsc: {
              sourceAddress: '5001000112',
              needBilling: true,
              servicePlanId: 'whitelabel',
              defaultRealm: 'AliceTest',
            },
            billing: {
              currency: 840,
              offnetPackageId: 5281,
              smsPackageId: 5282,
            },
            capabilities: [
              'im',
              'im.im-to-sms',
            ],
            companyInfo: {
              timezone: 'Dateline Standard Time',
              name: 'sampleCompany',
            },
            companyId: '5851286c3943a40001ef41f9',
            companyCode: 'provisioncomplete',
            carrierId: 'provisioncomplete.wl.maaiii.org',
          },
          taskErrors: [],
        };
        await Provisioning.create(provisioningData);
        const updatedCompanyCode = {
          provisioningId: provisioningData._id,
          profile: {
            companyCode: 'newcompanycode',
          },
        };
        const updatedServiceType = {
          provisioningId: provisioningData._id,
          profile: {
            serviceType: ServiceType.SDK,
          },
        };
        const updatedProvisoningArray = [updatedCompanyCode, updatedServiceType];
        for (const updatedProvisoning of updatedProvisoningArray) {
          await expect(provisioningService.updateProvisioning(updatedProvisoning)).to.be.rejectedWith(ValidationError);
        }
      }));
  });

  describe('completeProvisioning', () => {
    it('throws error when missing provisioningId', decorate(async({ provisioningService }) => {
      await expect(provisioningService.completeProvisioning()).to.be.rejected;
    }));

    it('sets the provisioning status to error when it has errors',
      decorate(async({ Provisioning, provisioningService }) => {
        const provisioningData = {
          _id: '57ea5b1ce9582cf6e54cfdb1',
          status: ProcessStatus.CREATED,
          profile: {
            paymentMode: PaymentMode.PRE_PAID,
            resellerCarrierId: 'sparkle.maaiii.org',
            resellerCompanyId: '579f0a9281ca6d7eb32d0dd1',
            country: 'AF',
            chargeWallet: ChargeWallet.WALLET_COMPANY,
            serviceType: ServiceType.WHITE_LABEL,
            smsc: {
              sourceAddress: '5001000112',
              needBilling: true,
              servicePlanId: 'whitelabel',
              defaultRealm: 'AliceTest',
            },
            billing: {
              currency: 840,
              offnetPackageId: 5281,
              smsPackageId: 5282,
            },
            capabilities: [
              'im',
              'im.im-to-sms',
            ],
            companyInfo: {
              timezone: 'Dateline Standard Time',
              name: 'sampleCompany',
            },
            companyId: '5851286c3943a40001ef41f9',
            companyCode: 'provisioncomplete',
            carrierId: 'provisioncomplete.wl.maaiii.org',
          },
          taskErrors: [],
        };
        await Provisioning.create(provisioningData);
        const completeResult = {
          errors: [new ValidationError()],
          provisioningId: provisioningData._id,
          results: {
            test: 1,
            createdId: 'createdId',
          },
        };
        await provisioningService.completeProvisioning(completeResult);
        const provisioningProfile = await Provisioning.findById(provisioningData._id);
        expect(provisioningProfile.status).to.equal(ProcessStatus.ERROR);
        expect(provisioningProfile.taskResults).to.deep.equal(completeResult.results);
        expect(provisioningProfile.taskErrors).to.have.lengthOf(completeResult.errors.length);
      }));

    it('sets the provisioning status to complete and update data when it has no error',
      decorate(async({ Provisioning, provisioningService }) => {
        const provisioningData = {
          _id: '57ea5b1ce9582cf6e54cfdb1',
          status: ProcessStatus.CREATED,
          profile: {
            paymentMode: PaymentMode.PRE_PAID,
            resellerCarrierId: 'sparkle.maaiii.org',
            resellerCompanyId: '579f0a9281ca6d7eb32d0dd1',
            country: 'AF',
            chargeWallet: ChargeWallet.WALLET_COMPANY,
            serviceType: ServiceType.WHITE_LABEL,
            smsc: {
              sourceAddress: '5001000112',
              needBilling: true,
              servicePlanId: 'whitelabel',
              defaultRealm: 'AliceTest',
            },
            billing: {
              currency: 840,
              offnetPackageId: 5281,
              smsPackageId: 5282,
            },
            capabilities: [
              'im',
              'im.im-to-sms',
            ],
            companyInfo: {
              timezone: 'Dateline Standard Time',
              name: 'sampleCompany',
            },
            companyCode: 'provisioncomplete',
          },
          taskErrors: [],
        };
        await Provisioning.create(provisioningData);
        const completeResult = {
          errors: [],
          provisioningId: provisioningData._id,
          results: {
            anotherId: 12345,
            createdId: 'createdId',
            carrierId: 'newCarrierId',
            companyId: '5799e2b58149bef30dd10c71',
          },
        };
        await provisioningService.completeProvisioning(completeResult);
        const provisioningProfile = await Provisioning.findById(provisioningData._id);
        expect(provisioningProfile.status).to.equal(ProcessStatus.COMPLETE);
        expect(provisioningProfile.taskResults).to.deep.equal(completeResult.results);
        expect(provisioningProfile.taskErrors).to.have.lengthOf(0);
        expect(provisioningProfile.profile.companyId).to.equal(completeResult.results.companyId);
        expect(provisioningProfile.profile.carrierId).to.equal(completeResult.results.carrierId);
      }));
  });
});
