import { expect } from 'chai';
import { getActiveChargingRateTable } from './../../../src/domain';

describe('domain/billing/getActiveChargingRateTable', () => {
  it('will find the first chargingRate which endDate is larger than the current time', () => {
    const chargingRates = [
      {
        id: '58325916bdcd0b0001c5c6b6',
        carrier: 'sparkle.maaiii.org',
        startDate: '2016-09-01T00:00:00Z',
        endDate: '2017-09-30T00:00:00Z',
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
      {
        id: '58325916bdcd0b0001c5c6b6',
        carrier: 'sparkle.maaiii.org',
        startDate: '2015-09-01T00:00:00Z',
        endDate: '2016-09-30T00:00:00Z',
        type: 'OFFNET_CALL',
        currency: 830,
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
    ];
    expect(getActiveChargingRateTable(chargingRates)).to.deep.equal(chargingRates[0]);
  });
});
