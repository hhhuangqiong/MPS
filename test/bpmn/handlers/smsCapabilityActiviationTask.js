import { expect } from 'chai';
import { ArgumentError } from 'common-errors';

import { createSmsCapabilityActivationTask, bpmnEvents } from '../../../src/bpmn';

describe('bpmn/handlers/createSmsCapabilityActivationTask', () => {
  it('throws ArgumentError when any of dependencies is not provided', () => {
    const capabilitiesManagement = {};
    const templateService = {};
    const inputs = [
      [capabilitiesManagement, null],
      [null, templateService],
    ];
    inputs.forEach((args) => {
      expect(() => createSmsCapabilityActivationTask(...args)).to.throw(ArgumentError);
    });
  });

  it('returns a function which name is SMS_CAPABILITY_ACTIVATION', () => {
    const smsCapabilityActivationTask = createSmsCapabilityActivationTask({}, {});
    expect(smsCapabilityActivationTask.$meta.name).to.equal(bpmnEvents.SMS_CAPABILITY_ACTIVATION);
  });
});
