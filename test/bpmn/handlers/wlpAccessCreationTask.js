import chai, { expect } from 'chai';
import sinon from 'sinon';
import { Logger } from 'winston';
import chaiPromised from 'chai-as-promised';
import { NotImplementedError, ArgumentNullError, ReferenceError, ArgumentError } from 'common-errors';

import { createWlpAccessCreationTask, bpmnEvents } from '../../../src/bpmn';

chai.use(chaiPromised);

describe('bpmn/handlers/createWlpAccessCreationTask', () => {
  it('throws ArgumentError when any of dependencies is not provided', () => {
    const accessManagement = {};
    const templateService = {};
    const inputs = [
      [null, accessManagement],
      [templateService, null],
    ];
    inputs.forEach((args) => {
      expect(() => createWlpAccessCreationTask(...args)).to.throw(ArgumentError);
    });
  });

  it('returns a function which name is WLP_ACCESS_CREATION', () => {
    const wlpAccessCreationTask = createWlpAccessCreationTask({}, {});
    expect(wlpAccessCreationTask.$meta.name).to.equal(bpmnEvents.WLP_ACCESS_CREATION);
  });

  it('throws NotImplementedError when create reseller company', async () => {
    const wlpAccessCreationTask = createWlpAccessCreationTask({}, {});
    const state = { results: { companyId: 'companyId' } };
    const profile = { isReseller: true };
    const context = { logger: new Logger() };
    await expect(wlpAccessCreationTask(state, profile, context)).to.be.rejectedWith(NotImplementedError);
  });

  it('throws ArgumentNullError when missing company id', async () => {
    const wlpAccessCreationTask = createWlpAccessCreationTask({}, {});
    const state = { results: { } };
    const profile = { isReseller: false };
    const context = { logger: new Logger() };
    await expect(wlpAccessCreationTask(state, profile, context)).to.be.rejectedWith(ArgumentNullError);
  });

  it('won\'t create role when adminRoleCreated true in state result', async () => {
    const templateService = {
      render: sinon.stub().returns({}),
    };
    const accessManagement = {
      createRole: sinon.stub().returns({}),
    };
    const wlpAccessCreationTask = createWlpAccessCreationTask(templateService, accessManagement);
    const state = { results: { adminRoleCreated: true, companyId: 'companyId' } };
    const profile = { isReseller: false };
    const context = { logger: new Logger() };
    await expect(wlpAccessCreationTask(state, profile, context)).to.be.fulfiled;
    expect(templateService.render.calledOnce).to.be.false;
    expect(accessManagement.createRole.calledOnce).to.be.false;
  });

  it('creates roles', async () => {
    const companyId = '5799e2b58149bef30dd10c71';
    const role = {
      name: 'Admin',
      service: 'wlp',
      company: companyId,
      permissions: {
        sms: ['read'],
        im: ['read'],
        call: ['read'],
        vsf: ['read'],
        topUp: ['read'],
        generalOverview: ['read'],
        verificationSdk: ['read'],
        endUser: ['update', 'read'],
        whitelist: ['create', 'update', 'read', 'delete'],
        role: ['create', 'update', 'read', 'delete'],
        user: ['create', 'update', 'read', 'delete'],
        endUserExport: ['read'],
        imExport: ['read'],
        callExport: ['read'],
        smsExport: ['read'],
        company: [],
      },
    };
    const templateService = {
      render: sinon.stub().returns(role),
    };
    const createRoleResponse = {
      body: {
        name: 'roleId',
      },
    };
    const accessManagement = {
      createRole: sinon.stub().returns(createRoleResponse),
    };
    const wlpAccessCreationTask = createWlpAccessCreationTask(templateService, accessManagement);
    const state = { results: { companyId } };
    const profile = {};
    const context = { logger: new Logger() };
    const res = await wlpAccessCreationTask(state, profile, context);
    expect(res.results.adminRoleCreated).to.be.true;
    expect(templateService.render.calledOnce).to.be.true;
    expect(accessManagement.createRole.calledOnce).to.be.true;
  });

  it('throws ReferenceError when receiving the incorrect response from access management', async () => {
    const companyId = '5799e2b58149bef30dd10c71';
    const role = {
      name: 'Admin',
      service: 'wlp',
      company: companyId,
      permissions: {
        sms: ['read'],
        im: ['read'],
        call: ['read'],
        vsf: ['read'],
        topUp: ['read'],
        generalOverview: ['read'],
        verificationSdk: ['read'],
        endUser: ['update', 'read'],
        whitelist: ['create', 'update', 'read', 'delete'],
        role: ['create', 'update', 'read', 'delete'],
        user: ['create', 'update', 'read', 'delete'],
        endUserExport: ['read'],
        imExport: ['read'],
        callExport: ['read'],
        smsExport: ['read'],
        company: [],
      },
    };
    const templateService = {
      render: sinon.stub().returns(role),
    };
    const incorrectCreateRoleResponse = {
      body: {},
    };
    const accessManagement = {
      createRole: sinon.stub().returns(incorrectCreateRoleResponse),
    };
    const wlpAccessCreationTask = createWlpAccessCreationTask(templateService, accessManagement);
    const state = { results: { companyId } };
    const profile = {};
    const context = { logger: new Logger() };
    await expect(wlpAccessCreationTask(state, profile, context)).to.be.rejectedWith(ReferenceError);
    expect(templateService.render.calledOnce).to.be.true;
    expect(accessManagement.createRole.calledOnce).to.be.true;
  });
});
