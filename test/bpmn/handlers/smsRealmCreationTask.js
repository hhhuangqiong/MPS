import chai, { expect } from 'chai';
import sinon from 'sinon';
import { ArgumentError, ArgumentNullError } from 'common-errors';
import chaiPromised from 'chai-as-promised';

import { createSmsRealmCreationTask, bpmnEvents } from '../../../src/bpmn';

chai.use(chaiPromised);

describe('bpmn/handlers/createSmsRealmCreationTask', () => {
  it('throws ArgumentError when any of dependencies is not provided', () => {
    const smsRealmManagement = {};
    const templateService = {};
    const inputs = [
      [null, smsRealmManagement],
      [templateService, null],
    ];
    inputs.forEach((args) => {
      expect(() => createSmsRealmCreationTask(...args)).to.throw(ArgumentError);
    });
  });

  it('returns a function which name is SMS_REALM_CREATION', () => {
    const smsRealmCreationTask = createSmsRealmCreationTask({}, {});
    expect(smsRealmCreationTask.$meta.name).to.equal(bpmnEvents.SMS_REALM_CREATION);
  });

  it('throws ArgumentNullError when missing carrierId in state', async () => {
    const smsRealmCreationTask = createSmsRealmCreationTask({}, {});
    const state = {
      results: {},
    };
    const profile = {};
    await expect(smsRealmCreationTask(state, profile)).to.be.rejectedWith(ArgumentNullError);
  });

  it('won\'t create sms realm when no realm in profile', async () => {
    const smsRealmManagement = {
      create: sinon.stub().returns({}),
    };
    const smsRealmCreationTask = createSmsRealmCreationTask({}, smsRealmManagement);
    const state = {
      results: {
        carrierId: 'carrierId',
      },
    };
    const profile = {
      smsc: {},
    };
    await expect(smsRealmCreationTask(state, profile)).to.be.fulfiled;
    expect(smsRealmManagement.create.calledOnce).to.be.false;
  });

  it('creates sms realm when has realm in profile', async () => {
    const smsRealmTemplate = {
      identifier: 'carrierId.sms-realm',
      connection_strategy: {
        type: 'explicit',
        system_id: 'systemId',
        password: 'password',
        bindings_per_smsc: 100,
      },
    };
    const createRealmResponse = {
      body: {
        id: 'realmId',
      },
    };
    const smsRealmManagement = {
      create: sinon.stub().returns(createRealmResponse),
    };
    const templateService = {
      render: sinon.stub().returns(smsRealmTemplate),
    };
    const smsRealmCreationTask = createSmsRealmCreationTask(templateService, smsRealmManagement);

    const state = {
      results: {
        carrierId: 'carrierId',
      },
    };
    const profile = {
      smsc: {
        realm: {
          ip: '192.168.0.1',
          port: '1234',
        },
      },
    };
    const res = await smsRealmCreationTask(state, profile);
    expect(smsRealmManagement.create.calledOnce).to.be.true;
    expect(templateService.render.calledOnce).to.be.true;
    expect(res.results.smsRealmId).to.equal(createRealmResponse.body.id);
  });

  it('throws ReferenceError when no realm id returned', async () => {
    const smsRealmTemplate = {
      identifier: 'carrierId.sms-realm',
      connection_strategy: {
        type: 'explicit',
        system_id: 'systemId',
        password: 'password',
        bindings_per_smsc: 100,
      },
    };
    const incorrectCreateRealmResponse = {
      body: {},
    };
    const smsRealmManagement = {
      create: sinon.stub().returns(incorrectCreateRealmResponse),
    };
    const templateService = {
      render: sinon.stub().returns(smsRealmTemplate),
    };
    const smsRealmCreationTask = createSmsRealmCreationTask(templateService, smsRealmManagement);

    const state = {
      results: {
        carrierId: 'carrierId',
      },
    };
    const profile = {
      smsc: {
        realm: {
          ip: '192.168.0.1',
          port: '1234',
        },
      },
    };
    await expect(smsRealmCreationTask(state, profile)).to.be.rejectedWith(ReferenceError);
    expect(smsRealmManagement.create.calledOnce).to.be.true;
    expect(templateService.render.calledOnce).to.be.true;
  });
});
