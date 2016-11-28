import { check } from './../../util';
import { ChargingRateType } from './../../domain';
import { createMaaiiRateTask } from './createMaaiiRateTask';
import { OFFNET_CHARGING_RATE_CREATION } from './bpmnEvents';

export function createOffnetChargingRateTask(maaiiRateManagement) {
  check.ok('maaiiRateManagement', maaiiRateManagement);

  const getOffnetChargingRate = createMaaiiRateTask(maaiiRateManagement, ChargingRateType.OFFNET_CALL);

  getOffnetChargingRate.$meta = {
    name: OFFNET_CHARGING_RATE_CREATION,
  };

  return getOffnetChargingRate;
}

export default createOffnetChargingRateTask;
