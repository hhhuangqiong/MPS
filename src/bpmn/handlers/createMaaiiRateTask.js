import _ from 'lodash';
import { check } from 'm800-util';
import { ReferenceError, ArgumentNullError } from 'common-errors';

import { getActiveChargingRateTable } from '../../domain';

export function createMaaiiRateTask(maaiiRateManagement, type) {
  check.ok('maaiiRateManagement', maaiiRateManagement);
  check.predicate('type', type, _.isString);

  async function maaiiRate(state, profile) {
    const ChargeRateIdName = {
      OFFNET_CALL: 'offnetChargingRateId',
      SMS: 'smsChargingRateId',
    };
    // early return if it is already created the charge rate id
    if (state.results[ChargeRateIdName[type]]) {
      return null;
    }

    const { carrierId } = state.results;
    if (!carrierId) {
      throw new ArgumentNullError('carrierId');
    }

    const resellerRateTables = await maaiiRateManagement.getChargingRateTables(profile.resellerCarrierId, type);
    const activeRateTable = getActiveChargingRateTable(resellerRateTables.body);
    // it is acceptable to has no rate because it will use the default rate in the back end side.
    // If fail to find any validation rates, early return.
    if (_.isNil(activeRateTable)) {
      return null;
    }

    // post as SME charging rate
    const rateTableWithoutIdAndCarrier = _.omit(activeRateTable, ['id', 'carrier']);
    const ratesWithoutCountryCode = _.map(rateTableWithoutIdAndCarrier.rates, rate => (
      _.omit(rate, ['destinationCountryCode', 'destinationIso3CountryCode'])
    ));
    // add a new field updatedUser and set it as "MPS"
    const requestRateTable = { ...rateTableWithoutIdAndCarrier, rates: ratesWithoutCountryCode, updatedUser: 'MPS' };
    const chargingRateObj = await maaiiRateManagement.createChargingRateTable(carrierId, requestRateTable);

    const { id: chargingRateId } = chargingRateObj.body;
    if (!chargingRateId) {
      throw new ReferenceError('offnetCallChargeRateId is not defined in response body');
    }

    return {
      results: {
        [ChargeRateIdName[type]]: chargingRateId,
      },
    };
  }

  return maaiiRate;
}

export default createMaaiiRateTask;
