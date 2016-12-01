import { expect } from 'chai';
import sinon from 'sinon';
import { ArgumentError, ReferenceError } from 'common-errors';
import { createMaaiiRateTask } from '../../src/bpmn/handlers/createMaaiiRateTask';
const OFFNET_CALL = 'OFFNET_CALL';
const SMS = 'SMS';

describe('bpmn/handlers/createMaaiiRateTask', () => {
  it('throws ArgumentError when maaiiRateManagement is not provided', () => {
    expect(() => createMaaiiRateTask(null, OFFNET_CALL)).to.throw(ArgumentError);
  });

  it('throws ArgumentError when type is not string', () => {
    const MaaiiRateManagement = {
      getChargingRateTables: () => {},
      createChargingRateTable: () => {},
    };
    expect(() => createMaaiiRateTask(MaaiiRateManagement, null)).to.throw(ArgumentError);
  });
  describe('maaiiRateTask', async () => {
    it('throws ArgumentError when state.results.carrierId is empty', async () => {
      const state = {
        results: {
          carrierId: null,
        },
      };
      const chargingRateObj = {};
      const profile = {
        resellerCarrierId: 'sparkle.maaii.org',
      };
      const resellerRateTableToRes = {};
      const MaaiiRateManagement = {
        getChargingRateTables: sinon.stub().returns(Promise.resolve(resellerRateTableToRes)),
        createChargingRateTable: sinon.stub().returns(Promise.resolve(chargingRateObj)),
      };
      const maaiiRateTask = createMaaiiRateTask(MaaiiRateManagement, OFFNET_CALL);
      let errorThrown = false;
      // test async function
      try {
        await maaiiRateTask(state, profile);
      } catch (err) {
        expect(err).to.be.instanceOf(ArgumentError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });

    it('throws ReferenceError after getChargingRateTables function return the empty chargingTable', async () => {
      const state = {
        results: {
          carrierId: 'test',
        },
      };
      const chargingRateObj = {};
      const profile = {
        resellerCarrierId: 'sparkle.maaii.org',
      };
      const resellerRateTableToRes = {
        body: [],
      };
      const MaaiiRateManagement = {
        getChargingRateTables: sinon.stub().returns(Promise.resolve(resellerRateTableToRes)),
        createChargingRateTable: sinon.stub().returns(Promise.resolve(chargingRateObj)),
      };
      const maaiiRateTask = createMaaiiRateTask(MaaiiRateManagement, OFFNET_CALL);
      let errorThrown = false;
      // test async function
      try {
        await maaiiRateTask(state, profile);
      } catch (err) {
        expect(err).to.be.instanceOf(ReferenceError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });

    it('throws ReferenceError if the there is not matched rate after validation', async () => {
      const state = {
        results: {
          carrierId: 'test',
        },
      };
      const chargingRateObj = {
        body: { id: '12345678' },
      };
      const profile = {
        resellerCarrierId: 'sparkle.maaii.org',
      };
      const resellerRateTableToRes = {
        body: [
          {
            id: '58325916bdcd0b0001c5c6b6',
            carrier: 'sparkle.maaiii.org',
            startDate: '2016-09-01T00:00:00Z',
            endDate: '2016-10-08T00:00:00Z',
            type: 'OFFNET_CALL',
            currency: 840,
            rates: [
              {
                destinationCountryCode: 'HK',
                destinationIso3CountryCode: 'HKG',
                name: 'HONG KONG Mobile',
                packageId: 5170,
                homeArea: 'World',
                originArea: 'World',
                destinationPrefixes: [
                  +8529,
                  +8526,
                  +8525,
                ],
                connectionFee: 0.0,
                rate: 1.0,
                rateUnit: 'min',
              },
            ],
          },
        ],
      };
      const MaaiiRateManagement = {
        getChargingRateTables: sinon.stub().returns(Promise.resolve(resellerRateTableToRes)),
        createChargingRateTable: sinon.stub().returns(Promise.resolve(chargingRateObj)),
      };
      const maaiiRateTask = createMaaiiRateTask(MaaiiRateManagement, OFFNET_CALL);
      let errorThrown = false;
      // test async function
      try {
        await maaiiRateTask(state, profile);
      } catch (err) {
        expect(err).to.be.instanceOf(ReferenceError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });

    it('throws ReferenceError after createChargingRateTable does not return chargingRateId ', async () => {
      const state = {
        results: {
          carrierId: 'test',
        },
      };
      const profile = {
        resellerCarrierId: 'sparkle.maaii.org',
      };
      const chargingRateObj = {
        body: { id: null },
      };
      const resellerRateTableToRes = {
        body: [],
      };
      const MaaiiRateManagement = {
        getChargingRateTables: sinon.stub().returns(Promise.resolve(resellerRateTableToRes)),
        createChargingRateTable: sinon.stub().returns(Promise.resolve(chargingRateObj)),
      };
      const maaiiRateTask = createMaaiiRateTask(MaaiiRateManagement, OFFNET_CALL);
      let errorThrown = false;
      // test async function
      try {
        await maaiiRateTask(state, profile);
      } catch (err) {
        expect(err).to.be.instanceOf(ReferenceError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });

    it('should return the offnetChargingRateId if the type is OFFNET_CALL and these functions will be called once', async () => {
      const state = {
        results: {
          carrierId: 'test',
        },
      };
      const chargingRateObj = {
        body: { id: '12345678' },
      };
      const profile = {
        resellerCarrierId: 'sparkle.maaii.org',
      };
      const resellerRateTableToRes = {
        body: [
          {
            id: '58325916bdcd0b0001c5c6b6',
            carrier: 'sparkle.maaiii.org',
            startDate: '2016-09-01T00:00:00Z',
            endDate: '2017-10-08T00:00:00Z',
            type: 'OFFNET_CALL',
            currency: 840,
            rates: [
              {
                destinationCountryCode: 'HK',
                destinationIso3CountryCode: 'HKG',
                name: 'HONG KONG Mobile',
                packageId: 5170,
                homeArea: 'World',
                originArea: 'World',
                destinationPrefixes: [
                  +8529,
                  +8526,
                  +8525,
                ],
                connectionFee: 0.0,
                rate: 1.0,
                rateUnit: 'min',
              },
            ],
          },
        ],
      };
      const MaaiiRateManagement = {
        getChargingRateTables: sinon.stub().returns(Promise.resolve(resellerRateTableToRes)),
        createChargingRateTable: sinon.stub().returns(Promise.resolve(chargingRateObj)),
      };
      const maaiiRateTask = createMaaiiRateTask(MaaiiRateManagement, OFFNET_CALL);
      // test async function
      const result = await maaiiRateTask(state, profile);
      expect(MaaiiRateManagement.getChargingRateTables.calledOnce).to.be.true;
      expect(MaaiiRateManagement.createChargingRateTable.calledOnce).to.be.true;
      expect(result.results.offnetChargingRateId).to.equal(chargingRateObj.body.id);
    });
    it('should return the smsChargingRateId if the type is SMS and these functions will be called once', async () => {
      const state = {
        results: {
          carrierId: 'test',
        },
      };
      const chargingRateObj = {
        body: { id: '12345678' },
      };
      const profile = {
        resellerCarrierId: 'sparkle.maaii.org',
      };
      const resellerRateTableToRes = {
        body: [
          {
            id: '58325916bdcd0b0001c5c6b6',
            carrier: 'sparkle.maaiii.org',
            startDate: '2016-09-01T00:00:00Z',
            endDate: '2017-10-08T00:00:00Z',
            type: 'OFFNET_CALL',
            currency: 840,
            rates: [
              {
                destinationCountryCode: 'HK',
                destinationIso3CountryCode: 'HKG',
                name: 'HONG KONG Mobile',
                packageId: 5170,
                homeArea: 'World',
                originArea: 'World',
                destinationPrefixes: [
                  +8529,
                  +8526,
                  +8525,
                ],
                connectionFee: 0.0,
                rate: 1.0,
                rateUnit: 'min',
              },
            ],
          },
        ],
      };
      const MaaiiRateManagement = {
        getChargingRateTables: sinon.stub().returns(Promise.resolve(resellerRateTableToRes)),
        createChargingRateTable: sinon.stub().returns(Promise.resolve(chargingRateObj)),
      };
      const maaiiRateTask = createMaaiiRateTask(MaaiiRateManagement, SMS);
      // test async function
      const result = await maaiiRateTask(state, profile);
      expect(MaaiiRateManagement.getChargingRateTables.calledOnce).to.be.true;
      expect(MaaiiRateManagement.createChargingRateTable.calledOnce).to.be.true;
      expect(result.results.smsChargingRateId).to.equal(chargingRateObj.body.id);
    });
  });
});
