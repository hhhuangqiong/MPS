import { expect } from 'chai';
import { ArgumentError } from 'common-errors';
import { bpmnEvents } from '../../../src/bpmn';
import createImToSmsCapabilityActivationTask from '../../../src/bpmn/handlers/imToSmsCapabilityActivationTask';

describe('bpmn/handlers/imToSmsCapabilityActivationTask', () => {
  it('throws ArgumentError when any of dependencies is not provided', () => {
    const capabilitiesManagement = {};
    const templateService = {};
    const input = [
      [null, templateService],
      [capabilitiesManagement, null],
    ];
    input.forEach(args => {
      expect(() => createImToSmsCapabilityActivationTask(args)).to.throw(ArgumentError);
    });
  });
  describe('createSmsProfileCapabilityActivationTask', () => {
    it('returns a function which name is IM_TO_SMS_CAPABILITY_ACTIVATION', () => {
      const capabilitiesManagement = {};
      const templateService = {};
      const result = createImToSmsCapabilityActivationTask(capabilitiesManagement, templateService);
      expect(result.$meta.name).to.equal(bpmnEvents.IM_TO_SMS_CAPABILITY_ACTIVATION);
    });
  });
});
