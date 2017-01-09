import chai, { expect } from 'chai';
import sinon from 'sinon';
import { ArgumentError, ArgumentNullError, IncompleteResultError } from 'common-errors';
import chaiPromised from 'chai-as-promised';
import { createCertificationCreationTask, bpmnEvents } from '../../../src/bpmn';

chai.use(chaiPromised);

describe('bpmn/handlers/createCertificationCreationTask', () => {
  it('throws ArgumentError when maaiiRateManagement is not provided', () => {
    expect(() => createCertificationCreationTask(null)).to.throw(ArgumentError);
  });
  it('returns a function which name is CERTIFICATION_CREATION', () => {
    const certificationManagement = {};
    const result = createCertificationCreationTask(certificationManagement);
    expect(result.$meta.name).to.equal(bpmnEvents.CERTIFICATION_CREATION);
  });
  describe('createCertificates', () => {
    it('returns early if the certificatesCreated is already exists', async () => {
      const certificationManagement = {
        getTemplates: sinon.stub(),
      };
      const state = {
        results: {
          certificatesCreated: '123',
        },
      };
      const profile = {};
      const createCertificates = createCertificationCreationTask(certificationManagement);
      const result = await createCertificates(state, profile);
      expect(result).to.be.null;
      expect(certificationManagement.getTemplates.called).to.be.false;
    });
    it('throws ArgumentNullError when applicationIdentifier is empty in state', async () => {
      const certificationManagement = {
        getTemplates: () => {},
      };
      const state = {
        results: {
          certificatesCreated: null,
          applicationIdentifier: null,
        },
      };
      const profile = {};
      const createCertificates = createCertificationCreationTask(certificationManagement);
      await expect(createCertificates(state, profile)).to.be.rejectedWith(ArgumentNullError);
    });
    it('throws ArgumentNullError when resellerCarrierId is empty in profile', async () => {
      const certificationManagement = {
        getTemplates: () => {},
      };
      const state = {
        results: {
          certificatesCreated: null,
          applicationIdentifier: '123',
        },
      };
      const profile = {
        resellerCarrierId: null,
      };
      const createCertificates = createCertificationCreationTask(certificationManagement);
      await expect(createCertificates(state, profile)).to.be.rejectedWith(ArgumentNullError);
    });
    it('throws ReferenceError when key attribute:group is empty in reponse templates', async () => {
      const res = {
        body: {
          group: null,
        },
      };
      const certificationManagement = {
        getTemplates: sinon.stub().returns(res),
      };
      const state = {
        results: {
          certificatesCreated: null,
          applicationIdentifier: '123',
        },
      };
      const profile = {
        resellerCarrierId: '123',
      };
      const createCertificates = createCertificationCreationTask(certificationManagement);
      await expect(createCertificates(state, profile)).to.be.rejectedWith(ReferenceError);
    });
    it('throws ReferenceError when certificates is not an array in reponse templates', async () => {
      const res = {
        body: {
          group: 'abc',
          certificates: 'abc',
        },
      };
      const certificationManagement = {
        getTemplates: sinon.stub().returns(res),
      };
      const state = {
        results: {
          certificatesCreated: null,
          applicationIdentifier: '123',
        },
      };
      const profile = {
        resellerCarrierId: 123,
      };
      const createCertificates = createCertificationCreationTask(certificationManagement);
      await expect(createCertificates(state, profile)).to.be.rejectedWith(ReferenceError);
    });
    it('throws IncompleteResultError when certificateId id missing from the certificates server', async () => {
      const res = {
        body: {
          group: 'abc',
          certificates: [{ templateId: 1 }, { templateId: 2 }],
        },
      };
      const resCertificate = {
        body: {
          id: null,
        },
      };
      const certificationManagement = {
        getTemplates: sinon.stub().returns(res),
        create: sinon.stub().returns(resCertificate),
      };
      const state = {
        results: {
          applicationIdentifier: '123',
        },
      };
      const profile = {
        resellerCarrierId: 123,
      };
      const createCertificates = createCertificationCreationTask(certificationManagement);
      await expect(createCertificates(state, profile)).to.be.rejectedWith(IncompleteResultError);
      expect(certificationManagement.getTemplates.calledOnce).to.be.true;
      expect(certificationManagement.create.calledOnce).to.be.true;
    });
    it('updates certificates after the function is finished', async () => {
      const res = {
        body: {
          group: 'abc',
          certificates: [
           { templateId: 1, platform_id: 'test', type: 'offnet' },
          ],
        },
      };
      const resCertificate = {
        body: {
          id: 'm800',
        },
      };
      const certificationManagement = {
        getTemplates: sinon.stub().returns(res),
        create: sinon.stub().returns(resCertificate),
      };
      const state = {
        results: {
          applicationIdentifier: '123',
          certificates:
          { templateId: '123:test:offnet', certificateId: 'm800' },
        },
      };
      const profile = {
        resellerCarrierId: 123,
      };
      const createCertificates = createCertificationCreationTask(certificationManagement);
      const response = await createCertificates(state, profile);
      expect(response.results.certificates).to.eql([{ templateId: '123:test:offnet', certificateId: 'm800' }]);
      expect(response.results.certificatesCreated).to.be.true;
      expect(certificationManagement.getTemplates.calledOnce).to.be.true;
      expect(certificationManagement.create.called).to.be.true;
    });
  });
});
