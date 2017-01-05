import { expect } from 'chai';
import { ArgumentError } from 'common-errors';

import { createOffnetCapabilityActivationTask, bpmnEvents } from '../../../src/bpmn';

describe('bpmn/handlers/createOffnetCapabilityActivationTask', () => {
  it('throws ArgumentError when capabilitiesManagement is not provided', () => {
    expect(createOffnetCapabilityActivationTask).to.throw(ArgumentError);
  });

  it('returns a function which name is ONNET_CAPABILITY_ACTIVATION', () => {
    const offnetCapabilityActivationTask = createOffnetCapabilityActivationTask({});
    expect(offnetCapabilityActivationTask.$meta.name).to.equal(bpmnEvents.OFFNET_CAPABILITY_ACTIVATION);
  });
});
