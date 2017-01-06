import { expect } from 'chai';
import { ArgumentError } from 'common-errors';
import { bpmnEvents } from '../../../src/bpmn';
import createImCapabilityActivationTask from '../../../src/bpmn/handlers/imCapabilityActivationTask';

describe('bpmn/handlers/imCapabilityActivationTask', () => {
  it('throws ArgumentError when capabilitiesManagement is not provided', () => {
    expect(() => createImCapabilityActivationTask(null)).to.throw(ArgumentError);
  });
  describe('createCapabilityActivationTask', () => {
    it('returns a function which name is IM_CAPABILITY_ACTIVATION', () => {
      const capabilitiesManagement = {};
      const result = createImCapabilityActivationTask(capabilitiesManagement);
      expect(result.$meta.name).to.equal(bpmnEvents.IM_CAPABILITY_ACTIVATION);
    });
  });
});
