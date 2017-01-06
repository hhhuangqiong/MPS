import chai, { expect } from 'chai';
import sinon from 'sinon';
import chaiPromised from 'chai-as-promised';
import { ArgumentError } from 'common-errors';
import { bpmnEvents } from '../../../src/bpmn';
import createFeatureSetCreationTask from '../../../src/bpmn/handlers/featureSetCreationTask';

chai.use(chaiPromised);

describe('bpmn/handlers/createFeatureSetCreationTask', () => {
  it('throws ArgumentError when featureSetManagement is not provided', () => {
    expect(() => createFeatureSetCreationTask(null)).to.throw(ArgumentError);
  });
  it('returns a function which name is FEATURE_SET_CREATION', () => {
    const featureSetManagement = {};
    const result = createFeatureSetCreationTask(featureSetManagement);
    expect(result.$meta.name).to.equal(bpmnEvents.FEATURE_SET_CREATION);
  });
  describe('createFeatureSet', () => {
    it('returns null if featureSetId is already exit', async () => {
      const state = {
        results: {
          featureSetId: '123',
        },
      };
      const profile = {};
      const featureSetManagement = {};
      const createFeatureSet = createFeatureSetCreationTask(featureSetManagement);
      await expect(createFeatureSet(state, profile)).to.eventually.be.null;
    });
    it('throws ArgumentError when carrierId is not exits in state', async () => {
      const state = {
        results: {
          featureSetId: null,
          carrierId: null,
        },
      };
      const profile = {};
      const featureSetManagement = {};
      const createFeatureSet = createFeatureSetCreationTask(featureSetManagement);
      await expect(createFeatureSet(state, profile)).to.be.rejectedWith(ArgumentError);
    });
    it('throws ArgumentError when resellerCarrierId is not exits in state', async () => {
      const state = {
        results: {
          featureSetId: null,
          carrierId: '123',
        },
      };
      const profile = {
        resellerCarrierId: null,
      };
      const featureSetManagement = {};
      const createFeatureSet = createFeatureSetCreationTask(featureSetManagement);
      await expect(createFeatureSet(state, profile)).to.be.rejectedWith(ArgumentError);
    });
    it('throws ReferenceError when key attribute:group is empty in reponse templates', async () => {
      const state = {
        results: {
          featureSetId: null,
          carrierId: '123',
        },
      };
      const profile = {
        resellerCarrierId: '123',
      };
      const res = {
        body: {
          group: null,
        },
      };
      const featureSetManagement = {
        getFeatureSetTemplate: sinon.stub().returns(res),
      };
      const createFeatureSet = createFeatureSetCreationTask(featureSetManagement);
      await expect(createFeatureSet(state, profile)).to.be.rejectedWith(ReferenceError);
      expect(featureSetManagement.getFeatureSetTemplate.calledOnce).to.be.true;
    });
    it('throws ReferenceError when features is not an array in reponse templates', async () => {
      const state = {
        results: {
          featureSetId: null,
          carrierId: '123',
        },
      };
      const profile = {
        resellerCarrierId: '123',
      };
      const res = {
        body: {
          group: 'abc',
          features: null,
        },
      };
      const featureSetManagement = {
        getFeatureSetTemplate: sinon.stub().returns(res),
      };
      const createFeatureSet = createFeatureSetCreationTask(featureSetManagement);
      await expect(createFeatureSet(state, profile)).to.be.rejectedWith(ReferenceError);
      expect(featureSetManagement.getFeatureSetTemplate.calledOnce).to.be.true;
    });
    it('throws ReferenceError when featureSetId is not exit in the response', async () => {
      const state = {
        results: {
          featureSetId: null,
          carrierId: '123',
        },
      };
      const profile = {
        resellerCarrierId: '123',
      };
      const res = {
        body: {
          group: 'abc',
          features: [1, 2, 3],
        },
      };
      const featureSetManagement = {
        getFeatureSetTemplate: sinon.stub().returns(res),
        createFeatureSet: sinon.stub().returns(res),
      };
      const createFeatureSet = createFeatureSetCreationTask(featureSetManagement);
      await expect(createFeatureSet(state, profile)).to.be.rejectedWith(ReferenceError);
      expect(featureSetManagement.getFeatureSetTemplate.calledOnce).to.be.true;
      expect(featureSetManagement.createFeatureSet.calledOnce).to.be.true;
    });
    it('returns the featureSetId and featureSetIdentifier to the results', async () => {
      const state = {
        results: {
          featureSetId: null,
          carrierId: 'abc',
        },
      };
      const profile = {
        resellerCarrierId: '123',
      };
      const res = {
        body: {
          group: 'abc',
          features: [1, 2, 3],
        },
      };
      const resFeature = {
        body: {
          id: '1223',
        },
      };
      const featureSetManagement = {
        getFeatureSetTemplate: sinon.stub().returns(res),
        createFeatureSet: sinon.stub().returns(resFeature),
      };
      const createFeatureSet = createFeatureSetCreationTask(featureSetManagement);
      const result = await createFeatureSet(state, profile);
      expect(result.results.featureSetId).to.be.equal(resFeature.body.id);
      expect(result.results.featureSetIdentifier).to.be.equal('abc.feature-set');
      expect(featureSetManagement.getFeatureSetTemplate.calledOnce).to.be.true;
      expect(featureSetManagement.createFeatureSet.calledOnce).to.be.true;
    });
  });
});
