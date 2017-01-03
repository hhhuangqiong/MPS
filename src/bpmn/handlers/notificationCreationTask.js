import _ from 'lodash';
import Promise from 'bluebird';
import Joi from 'joi';
import { ReferenceError, Error } from 'common-errors';
import { check } from 'm800-util';

import { IncompleteResultError } from './common';
import { NOTIFICATION_CREATION } from './bpmnEvents';

export function createNotificationCreationTask(notificationManagement, concurrencyOptions) {
  check.ok('notificationManagement', notificationManagement);
  concurrencyOptions = check.sanitizeSchema('concurrencyOptions', concurrencyOptions, Joi.object({
    maxConcurrentRequests: Joi.number().default(4),
  }));

  // get templates by resellerCarrierId
  async function getTemplates(resellerCarrierId) {
    const res = await notificationManagement.getTemplates({ group: resellerCarrierId });
    const { notifications: templates } = res.body;
    if (!_.isArray(templates)) {
      throw new ReferenceError('Unexpected response from CPS: expecting `notifications` array');
    }
    return templates;
  }

  async function createNotification(carrierId, template) {
    template.carrier = carrierId;
    const res = await notificationManagement.save(template);
    const { id } = res.body;
    if (!id) {
      throw new ReferenceError('Unexpected response from CPS. id missing');
    }
    return id;
  }

  async function createNotifications(state, profile) {
    const { notifications, notificationsCreated, carrierId } = state.results;
    if (notificationsCreated) {
      return null;
    }
    const templates = await getTemplates(profile.resellerCarrierId);
    // Create as many notifications as possible in parallel, but ignore errors for now
    const tasks = Promise.resolve(templates)
      .filter(template => !notifications.includes(template.identifier))
      .map(
        template => Promise.resolve(createNotification(carrierId, template)).reflect(),
        { concurrency: concurrencyOptions.maxConcurrentRequests }
      );
    const allResults = await Promise.all(tasks);
    // Split errors and successful results
    const [errors, createdNotifications] = _(allResults)
      .partition(i => i.isRejected())
      .thru(([rejected, resolved]) => [rejected.map(x => x.reason()), resolved.map(x => x.value())])
      .value();

    let updates = null;
    if (createdNotifications.length > 0) {
      updates = {
        results: {
          notificationsCreated: errors.length === 0,
          notifications: notifications.concat(createdNotifications),
        },
      };
    }
    if (errors.length > 0) {
      const messages = errors.map(x => `[${x.name}]: ${x.message}`).join('\n');
      const aggregateError = new Error(`${errors.length} notification creations failed: ${messages}.`);
      throw new IncompleteResultError(updates, aggregateError);
    }
    return updates;
  }

  createNotifications.$meta = {
    name: NOTIFICATION_CREATION,
  };

  return createNotifications;
}

export default createNotificationCreationTask;
