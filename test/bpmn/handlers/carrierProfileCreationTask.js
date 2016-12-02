import sinon from 'sinon';
import { expect } from 'chai';
import { ArgumentError, ReferenceError } from 'common-errors';
import { createCarrierProfileCreationTask, bpmnEvents } from '../../../src/bpmn';

describe('bpmn/handlers/carrierProfileCreationTask', () => {
  it('throws ArgumentError when carrierManagement is not provided', () => {
    expect(() => createCarrierProfileCreationTask(null)).to.throw(ArgumentError);
  });
  it('should return a function which name is CARRIER_PROFILE_CREATION', () => {
    const templateService = {};
    const carrierManagement = {};
    const result = createCarrierProfileCreationTask(templateService, carrierManagement);
    expect(result.$meta.name).to.equal(bpmnEvents.CARRIER_PROFILE_CREATION);
  });
  describe('createCarrierProfile', () => {
    it('should early return if the carrierProfileId is already exists', async () => {
      const state = {
        results: {
          carrierProfileId: '123',
        },
      };
      const res = {};
      const carrierManagement = {
        createCarrierProfile: sinon.stub().returns(res),
      };
      const createCarrierProfile = createCarrierProfileCreationTask(carrierManagement);
      const result = await createCarrierProfile(state);
      expect(result).to.be.null;
      expect(carrierManagement.createCarrierProfile.called).to.be.false;
    });
    it('throws ArgumentError when carrierId is empty in state', async () => {
      const state = {
        results: {
          carrierId: null,
        },
      };
      const carrierManagement = {};
      const createCarrierProfile = createCarrierProfileCreationTask(carrierManagement);
      let errorThrown = false;
      try {
        await createCarrierProfile(state);
      } catch (err) {
        expect(err).to.be.instanceOf(ArgumentError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });
    it('throws ReferenceError when carrierProfileId is missing from carrier profile creation', async () => {
      const state = {
        results: {
          carrierId: 'test',
        },
      };
      const rescarrierProfile = {
        body: { id: null },
      };
      const carrierManagement = {
        createCarrierProfile: sinon.stub().returns(rescarrierProfile),
      };
      const createCarrierProfile = createCarrierProfileCreationTask(carrierManagement);
      let errorThrown = false;
      try {
        await createCarrierProfile(state);
      } catch (err) {
        expect(err).to.be.instanceOf(ReferenceError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });
    it('returns carrierProfileId if the carrier profile creation is success', async () => {
      const state = {
        results: {
          carrierId: 'test',
        },
      };
      const rescarrierProfile = {
        body: { id: '123456' },
      };
      const carrierManagement = {
        createCarrierProfile: sinon.stub().returns(rescarrierProfile),
      };
      const createCarrierProfile = createCarrierProfileCreationTask(carrierManagement);
      const result = await createCarrierProfile(state);
      expect(result.results.carrierProfileId).to.be.equal(rescarrierProfile.body.id);
    });
  });
});
