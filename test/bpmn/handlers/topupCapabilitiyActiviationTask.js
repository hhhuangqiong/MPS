import { expect } from 'chai';
import { ArgumentError } from 'common-errors';

import { createTopUpCapabilityActivationTask, bpmnEvents } from '../../../src/bpmn';

describe('bpmn/handlers/createTopUpCapabilityActivationTask', () => {
  it('throws ArgumentError when maaiiRateManagement is not provided', () => {
    expect(createTopUpCapabilityActivationTask).to.throw(ArgumentError);
  });

  it('returns a function which name is TOPUP_CAPABILITY_ACTIVATION', () => {
    const topUpCapabilityActivationTask = createTopUpCapabilityActivationTask({});
    expect(topUpCapabilityActivationTask.$meta.name).to.equal(bpmnEvents.TOPUP_CAPABILITY_ACTIVATION);
  });
});
