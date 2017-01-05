import { expect } from 'chai';
import sinon from 'sinon';
import { ArgumentError, ReferenceError } from 'common-errors';
import { createApiCapabilityActivationTask, bpmnEvents } from '../../../src/bpmn';

describe('bpmn/handlers/apiCapabilityActivationTask', () => {
  it('throws ArgumentError when capabilitiesManagement is not provided', () => {
    expect(() => createApiCapabilityActivationTask(null)).to.throw(ArgumentError);
  });
  it('returns a function which name is API_CAPABILITY_ACTIVATION', () => {
    const capabilitiesManagement = {};
    const result = createApiCapabilityActivationTask(capabilitiesManagement);
    expect(result.$meta.name).to.equal(bpmnEvents.API_CAPABILITY_ACTIVATION);
  });
  describe('activateApiCapabilityTask', () => {
    it('throws ArgumentError when carrierId is not exits in state', async () => {
      const state = {
        results: {
          carrierId: null,
        },
      };
      const developerObj = {
        body: {},
      };
      const capabilitiesManagement = {
        enableApiCapability: sinon.stub().returns(developerObj),
      };
      const activateApiCapabilityTask = createApiCapabilityActivationTask(capabilitiesManagement);
      let errorThrown = false;
      try {
        await activateApiCapabilityTask(state);
      } catch (err) {
        expect(err).to.be.instanceOf(ArgumentError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });
    it('skips the task if developerId is already exists in the process state',
      async () => {
        const state = {
          results: {
            carrierId: '123456',
            developerId: '23456789',
          },
        };
        const developerObj = {
          body: {},
        };
        const capabilitiesManagement = {
          enableApiCapability: sinon.stub().returns(developerObj),
        };
        const activateApiCapabilityTask = createApiCapabilityActivationTask(capabilitiesManagement);
        await activateApiCapabilityTask(state);
        expect(capabilitiesManagement.enableApiCapability.called).to.be.false;
      }
    );
    it('throws ReferenceError when developerId is missing from the results returned from server', async () => {
      const state = {
        results: {
          carrierId: '123456',
        },
      };
      const developerObj = {
        body: { id: null },
      };
      const capabilitiesManagement = {
        enableApiCapability: sinon.stub().returns(developerObj),
      };
      const activateApiCapabilityTask = createApiCapabilityActivationTask(capabilitiesManagement);
      let errorThrown = false;
      try {
        await activateApiCapabilityTask(state);
      } catch (err) {
        expect(err).to.be.instanceOf(ReferenceError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });
    it('should return developerId when provisioning capabilities successfully', async() => {
      const state = {
        results: {
          carrierId: '123456',
        },
      };
      const developerObj = {
        body: { id: '123456' },
      };
      const capabilitiesManagement = {
        enableApiCapability: sinon.stub().returns(developerObj),
      };
      const activateApiCapabilityTask = createApiCapabilityActivationTask(capabilitiesManagement);
      const result = await activateApiCapabilityTask(state);
      expect(capabilitiesManagement.enableApiCapability.calledOnce).to.be.true;
      expect(result.results.developerId).to.equal(developerObj.body.id);
    });
  });
});
