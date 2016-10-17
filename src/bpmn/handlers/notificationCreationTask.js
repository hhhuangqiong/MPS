import _ from 'lodash';
import Promise from 'bluebird';
import { ReferenceError, Error } from 'common-errors';

import { check, createTask } from './util';

export function createNotificationCreationTask(logger, notificationManagement) {
  check.ok('logger', logger);
  check.ok('notificationManagement', notificationManagement);

  function validateRerun(data, taskResult) {
    if (taskResult.done) {
      // already complete, skip
      return false;
    }
    return true;
  }

  // get templates by resellerCarrierId
  function getTemplates(resellerCarrierId) {
    return notificationManagement.getTemplates({ group: resellerCarrierId })
      .then(res => {
        const { notifications: templates } = res.body;

        if (!_.isArray(templates)) {
          throw new ReferenceError('Unexpected response from CPS: expecting `notifications` array');
        }

        return templates;
      });
  }

  function createNotification(carrierId, template) {
    template.carrier = carrierId;
    return notificationManagement.save(template)
      .then((res) => {
        const { id } = res.body;

        if (!id) {
          throw new ReferenceError('Unexpected response from CPS. id missing');
        }

        return {
          identifier: template.identifier,
          id,
        };
      });
  }

  function createNotifications(carrierId, taskResult, templates) {
    let notifications;
    try {
      notifications = JSON.parse(taskResult.notifications);
    } catch (e) {
      notifications = {};
    }
    // create notifications in parrallel
    return Promise.all(_.map(templates, template => {
      const notificationIdentifier = template.identifier;

      const result = notifications[notificationIdentifier];
      if (result) {
        // skip if notifcation created before
        return Promise.resolve(result).reflect();
      }

      return createNotification(carrierId, template)
      // reflect to wait for all requests to complete regardless any failure
        .reflect();
    }));
  }


  function run(data, taskResult, cb) {
    const { carrierId, resellerCarrierId } = data;

    const notifications = {};
    const errors = [];

    getTemplates(resellerCarrierId)
      .then((templates) => (createNotifications(carrierId, taskResult, templates)))
      .then((pendings) => {
        logger.info(`performed ${pendings.length} notification creations`);
        return Promise.each(pendings, (inspection) => {
          if (inspection.isRejected()) {
            errors.push(inspection.reason());
          } else {
            const { identifier } = inspection.value();
            notifications[identifier] = inspection.value();
          }
        });
      })
      .then(() => {
        if (errors.length > 0) {
          // fail if any save requests failed
          const failureMessages = _.reduce(Object.values(errors), (result, err) => {
            const errorMessage = `${err.name}(${err.message})`;
            return `${result}\n\n.${errorMessage}`;
          }, '');
          throw new Error(`${errors.length} notification creations failed: ${failureMessages}`);
        }

        cb(null, { notifications: JSON.stringify(notifications), done: true });
      })
      .catch((err) => {
        cb(err, { notifications: JSON.stringify(notifications), done: false });
      });
  }

  return createTask('NOTIFICATION_CREATION', run, { validateRerun }, logger);
}

export default createNotificationCreationTask;