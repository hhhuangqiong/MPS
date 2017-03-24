import _ from 'lodash';

export default function getActiveChargingRateTable(chargingRateTables) {
  // validate reseller rate : the endDate should be larger than current time
  // and will pick the first matched charging rate
  const currentTime = new Date();
  const chargingRate = _.find(chargingRateTables, rate => (
    new Date(rate.endDate) > currentTime
  ));
  return chargingRate;
}
