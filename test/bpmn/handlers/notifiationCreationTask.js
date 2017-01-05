import chai, { expect } from 'chai';
import sinon from 'sinon';
import { ArgumentError, IncompleteResultError } from 'common-errors';
import chaiPromised from 'chai-as-promised';

import { createNotificationCreationTask, bpmnEvents } from '../../../src/bpmn';

chai.use(chaiPromised);

describe('bpmn/handlers/createNotificationCreationTask', () => {
  it('throws ArgumentError when notificationManagement or concurrencyOptions is not provided', () => {
    const notificationManagement = {};
    const concurrencyOptions = {
      maxConcurrentRequests: 5,
    };
    const incorrectConcurrencyOptions = {};
    const inputs = [
      [notificationManagement, null],
      [notificationManagement, incorrectConcurrencyOptions],
      [null, concurrencyOptions],
    ];
    inputs.forEach(args => {
      expect(() => createNotificationCreationTask(...args)).to.throw(ArgumentError);
    });
  });


  it('returns a function which name is ONNET_CAPABILITY_ACTIVATION', () => {
    const notificationCreationTask = createNotificationCreationTask({}, {
      maxConcurrentRequests: 5,
    });
    expect(notificationCreationTask.$meta.name).to.equal(bpmnEvents.NOTIFICATION_CREATION);
  });

  it('throws ReferenceError when fail to get notification template', async () => {
    const notificationManagement = {
      getTemplates: sinon.stub().returns({ body: {} }),
      save: sinon.stub(),
    };
    const concurrencyOptions = { maxConcurrentRequests: 5 };
    const notificationCreationTask = createNotificationCreationTask(notificationManagement, concurrencyOptions);
    const state = {
      results: {
        notifications: [],
        carrierId: 'carrierId',
      },
    };
    const profile = {
      resellerCarrierId: 'resellerId',
    };
    await expect(notificationCreationTask(state, profile)).to.be.rejectedWith(ReferenceError);
    expect(notificationManagement.getTemplates.calledOnce).to.be.true;
    expect(notificationManagement.save.called).to.be.false;
  });

  it('creates notification', async () => {
    const carrierId = 'carrierId';
    const getTemplatesResponse = {
      body: {
        notifications: [
          {
            carrier: carrierId,
            name: 'name',
            description: 'description',
            identifier: 'com.maaii.notification.incoming.file',
            application_messages: {
              message_body: 'messageBody',
              message_attributes: {},
              rich_message: true,
            },
            pushed_messages: {
              message_body: 'messageBody',
              message_attributes: {},
              platform_specific_attributes: [],
            },
          },
          {
            carrier: carrierId,
            name: 'name1',
            description: 'description1',
            identifier: 'com.maaii.mums.confirmation',
          },
        ],
      },
    };
    const notificationManagement = {
      getTemplates: sinon.stub().returns(getTemplatesResponse),
      save: () => {},
    };
    const saveNotificationStub = sinon.stub(notificationManagement, 'save', param => ({
      body: {
        id: param.identifier,
      },
    }));
    const concurrencyOptions = { maxConcurrentRequests: 5 };
    const notificationCreationTask = createNotificationCreationTask(notificationManagement, concurrencyOptions);
    const state = {
      results: {
        notifications: [],
        carrierId,
      },
    };
    const profile = {
      resellerCarrierId: 'resellerId',
    };
    const res = await notificationCreationTask(state, profile);
    expect(res.results.notificationsCreated).to.be.true;
    expect(saveNotificationStub.callCount).to.equal(getTemplatesResponse.body.notifications.length);
    expect(res.results.notifications).to.have.lengthOf(getTemplatesResponse.body.notifications.length);
  });

  it('throws IncompleteResultError when failure in notificationManagement save action', async () => {
    const carrierId = 'carrierId';
    const getTemplatesResponse = {
      body: {
        notifications: [
          {
            carrier: carrierId,
            name: 'name',
            description: 'description',
            identifier: 'com.maaii.notification.incoming.file',
            application_messages: {
              message_body: 'messageBody',
              message_attributes: {},
              rich_message: true,
            },
            pushed_messages: {
              message_body: 'messageBody',
              message_attributes: {},
              platform_specific_attributes: [],
            },
          },
          {
            carrier: carrierId,
            name: 'name1',
            description: 'description1',
            identifier: 'com.maaii.mums.confirmation',
          },
        ],
      },
    };
    const notificationManagement = {
      getTemplates: sinon.stub().returns(getTemplatesResponse),
      save: sinon.stub().returns({ body: {} }),
    };
    const concurrencyOptions = { maxConcurrentRequests: 5 };
    const notificationCreationTask = createNotificationCreationTask(notificationManagement, concurrencyOptions);
    const state = {
      results: {
        notifications: [],
        carrierId,
      },
    };
    const profile = {
      resellerCarrierId: 'resellerId',
    };
    await expect(notificationCreationTask(state, profile)).to.be.rejectedWith(IncompleteResultError);
    expect(notificationManagement.getTemplates.calledOnce).to.be.true;
    expect(notificationManagement.save.callCount).to.equal(getTemplatesResponse.body.notifications.length);
  });
});
