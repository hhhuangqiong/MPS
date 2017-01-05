import { expect } from 'chai';
import { ArgumentError } from 'common-errors';

import { createOnnetCapabilityActivationTask, bpmnEvents } from '../../../src/bpmn';

describe('bpmn/handlers/createOnnetCapabilityActivationTask', () => {
  it('throws ArgumentError when capabilitiesManagement is not provided', () => {
    expect(createOnnetCapabilityActivationTask).to.throw(ArgumentError);
  });

  it('returns a function which name is ONNET_CAPABILITY_ACTIVATION', () => {
    const onnetCapabilityActivationTask = createOnnetCapabilityActivationTask({});
    expect(onnetCapabilityActivationTask.$meta.name).to.equal(bpmnEvents.ONNET_CAPABILITY_ACTIVATION);
  });
});
