import { expect } from 'chai';
import { ArgumentError } from 'common-errors';
import { createSmsChargingRateTask, bpmnEvents } from '../../../src/bpmn';

describe('bpmn/handlers/smsChargingRateCreationTask', () => {
  const SMS = 'SMS';
  it('throws ArgumentError when maaiiRateManagement is not provided', () => {
    expect(() => createSmsChargingRateTask(null, SMS)).to.throw(ArgumentError);
  });
  it('should return a function which name is SMS_CHARGING_RATE_CREATION', () => {
    const MaaiiRateManagement = {
      getChargingRateTables: () => {},
      createChargingRateTable: () => {},
    };
    const result = createSmsChargingRateTask(MaaiiRateManagement, SMS);
    expect(result.$meta.name).to.equal(bpmnEvents.SMS_CHARGING_RATE_CREATION);
  });
});
