import chai, { expect } from 'chai';
import sinon from 'sinon';
import chaiPromised from 'chai-as-promised';
import { ArgumentError, ReferenceError, NotImplementedError } from 'common-errors';
import { createCompanyCreationTask, bpmnEvents } from '../../../src/bpmn';
import { Logger } from 'winston';

chai.use(chaiPromised);

describe('bpmn/handlers/companyCreationTask', () => {
  it('throws ArgumentError when companyManagement is not provided', () => {
    expect(() => createCompanyCreationTask(null)).to.throw(ArgumentError);
  });
  it('returns a function which name is COMPANY_CREATION', () => {
    const companyManagement = {};
    const result = createCompanyCreationTask(companyManagement);
    expect(result.$meta.name).to.equal(bpmnEvents.COMPANY_CREATION);
  });
  describe('createCompany', () => {
    it('returns early if state already contains companyId', async () => {
      const state = {
        results: {
          companyId: '122333',
        },
      };
      const profile = {};
      const context = {};
      const companyManagement = {};
      const createCompany = createCompanyCreationTask(companyManagement);
      await expect(createCompany(state, profile, context)).to.eventually.be.null;
    });
    it('throws ReferenceError when provisioning reseller company is not supported yet', async () => {
      const state = {
        results: {
          companyId: null,
        },
      };
      const profile = {
        companyInfo: 'abc',
        country: 'abccc',
        isReseller: true,
        resellerCompanyId: 'm800',
      };
      const context = { logger: {} };
      const companyManagement = {};
      const createCompany = createCompanyCreationTask(companyManagement);
      await expect(createCompany(state, profile, context)).to.be.rejectedWith(NotImplementedError);
    });
    it('throws ReferenceError when id is not defined in response body for carrier creation', async () => {
      const state = {
        results: {
          companyId: null,
        },
      };
      const profile = {
        companyInfo: 'abc',
        country: 'abccc',
        isReseller: false,
        resellerCompanyId: 'm800',
      };
      const context = { logger: new Logger() };
      const res = {
        body: {
          id: null,
        },
      };
      const companyManagement = {
        createCompany: sinon.stub().returns(res),
      };
      const createCompany = createCompanyCreationTask(companyManagement);
      await expect(createCompany(state, profile, context)).to.be.rejectedWith(ReferenceError);
      expect(companyManagement.createCompany.calledOnce).to.be.true;
    });
    it('returns companyId when the task is finished', async () => {
      const state = {
        results: {
          companyId: null,
        },
      };
      const profile = {
        companyInfo: 'abc',
        country: 'abccc',
        isReseller: false,
        resellerCompanyId: 'm800',
      };
      const context = { logger: new Logger() };
      const res = {
        body: {
          id: '123',
        },
      };
      const companyManagement = {
        createCompany: sinon.stub().returns(res),
      };
      const createCompany = createCompanyCreationTask(companyManagement);
      const response = await createCompany(state, profile, context);
      expect(response.results.companyId).to.be.equal(res.body.id);
      expect(companyManagement.createCompany.calledOnce).to.be.true;
    });
  });
});
