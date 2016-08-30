import _ from 'lodash';
import Promise from 'bluebird';
import { ReferenceError, Error } from 'common-errors';

import logger from '../../utils/logger';
import ioc from '../../ioc';
import { createTask } from '../util/task';

const { NotificationManagement } = ioc.container;

function rerunValidation(data, taskResult) {
  if (taskResult.done) {
    // already complete, skip
    return false;
  }

  return true;
}

  // get templates by resellerCarrierId
function getTemplates(resellerCarrierId) {
  return NotificationManagement.getTemplates({ group: resellerCarrierId })
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
  return NotificationManagement.save(template)
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
  const { notifications } = taskResult;
  // create notifications in parrallel
  return Promise.all(_.map(templates, template => {
    const notificationIdentifier = template.identifier;

    const result = notifications && notifications[notificationIdentifier];
    if (result) {
      // skip if notifcation created before
      return Promise.resolve(result);
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
      logger(`performed ${pendings.length} notification creations`);
      return Promise.each(pendings, (inspection) => {
        if (inspection.isRejected()) {
          errors.push(inspection.reason());
        } else {
          const { identifier, id } = inspection.value();
          notifications[identifier] = id;
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

      cb(null, { notifications, done: true });
    })
    .catch((err) => {
      cb(err, { notifications, done: false });
    });
}

export default createTask('NOTIFICATION_CREATION', run, { rerunValidation });
