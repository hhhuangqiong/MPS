import { expect } from 'chai';
import { ArgumentError } from 'common-errors';

import { createPushCapabilityActivationTask, bpmnEvents } from '../../../src/bpmn';

describe('bpmn/handlers/createUserCarrierProfileCreationTask', () => {
  it('throws ArgumentError when capabilitiesManagement is not provided', () => {
    expect(createPushCapabilityActivationTask).to.throw(ArgumentError);
  });

  it('returns a function which name is PUSH_CAPABILITY_ACTIVATION', () => {
    const pushCapabilityActivationTask = createPushCapabilityActivationTask({});
    expect(pushCapabilityActivationTask.$meta.name).to.equal(bpmnEvents.PUSH_CAPABILITY_ACTIVATION);
  });
});
