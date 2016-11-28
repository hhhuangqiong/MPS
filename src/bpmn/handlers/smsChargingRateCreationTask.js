import { check } from './../../util';
import { ChargingRateType } from './../../domain';
import { createMaaiiRateTask } from './createMaaiiRateTask';
import { SMS_CHARGING_RATE_CREATION } from './bpmnEvents';

export function createSmsChargingRateTask(maaiiRateManagement) {
  check.ok('maaiiRateManagement', maaiiRateManagement);

  const getSmsChargingRate = createMaaiiRateTask(maaiiRateManagement, ChargingRateType.SMS);

  getSmsChargingRate.$meta = {
    name: SMS_CHARGING_RATE_CREATION,
  };

  return getSmsChargingRate;
}

export default createSmsChargingRateTask;
