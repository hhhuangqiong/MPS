import { expect } from 'chai';
import { ArgumentError } from 'common-errors';
import { createSmsChargingRateTask } from '../../src/bpmn/handlers/smsChargingRateCreationTask';

describe('bpmn/handlers/smsChargingRateCreationTask', () => {
  const SMS = 'SMS';
  it('throws ArgumentError when maaiiRateManagement is not provided', () => {
    expect(() => createSmsChargingRateTask(null, SMS)).to.throw(ArgumentError);
  });
  it('should return a function which $meta is SMS_CHARGING_RATE_CREATION', () => {
    const MaaiiRateManagement = {
      getChargingRateTables: () => {},
      createChargingRateTable: () => {},
    };
    const result = createSmsChargingRateTask(MaaiiRateManagement, SMS);
    expect(result.$meta.name).to.equal('SMS_CHARGING_RATE_CREATION');
  });
});
