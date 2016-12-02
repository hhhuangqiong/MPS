import { expect } from 'chai';
import { ArgumentError } from 'common-errors';
import { createOffnetChargingRateTask, bpmnEvents } from '../../../src/bpmn';

describe('bpmn/handlers/offnetChargingRateCreationTask', () => {
  const OFFNET_CALL = 'OFFNET_CALL';
  it('throws ArgumentError when maaiiRateManagement is not provided', () => {
    expect(() => createOffnetChargingRateTask(null, OFFNET_CALL)).to.throw(ArgumentError);
  });
  it('should return a function which name is OFFNET_CHARGING_RATE_CREATION', () => {
    const MaaiiRateManagement = {
      getChargingRateTables: () => {},
      createChargingRateTable: () => {},
    };
    const result = createOffnetChargingRateTask(MaaiiRateManagement, OFFNET_CALL);
    expect(result.$meta.name).to.equal(bpmnEvents.OFFNET_CHARGING_RATE_CREATION);
  });
});
