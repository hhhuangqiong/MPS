import _ from 'lodash';
import { ArgumentNullError } from 'common-errors';

import { createTask, check } from './util';

export function createCertificationCreationTask(logger, certificateManagement) {
  check.ok('logger', logger);
  check.ok('certificateManagement', certificateManagement);

  function validateRerun(data, taskResult) {
    if (taskResult.done) {
      // certicaates already created, skip
      return false;
    }
    return true;
  }

  function getKey(template, applicationIdentifier) {
    return `${applicationIdentifier}:${template.platform_id}:${template.type}`;
  }

  function createCertificate(template, applicationIdentifier) {
    const certificate = _.clone(template);
    certificate.application_identifier = applicationIdentifier;

    return certificateManagement.create(certificate);
  }

  function run(data, taskResult, cb) {
    const { resellerCarrierId, applicationIdentifier } = data;

    if (!applicationIdentifier) {
      cb(new ArgumentNullError('carrierId'));
      return;
    }

    if (!resellerCarrierId) {
      cb(new ArgumentNullError('resellerCarrierId'));
      return;
    }

    const certificates = {};
    let completed;
    try {
      completed = JSON.parse(taskResult.certificates);
    } catch (e) {
      completed = {};
    }

    // get feature set template by resller carrier id, i.e. use resellerCarrierId
    // as group
    certificateManagement.getTemplates(resellerCarrierId)
      .then((res) => {
        const templates = res.body;
        if (!templates.group || !_.isArray(templates.certificates)) {
          throw new ReferenceError('Unexpected response from CPS: key attr \'group\' missing');
        }

        return templates;
      })
      .then((templates) => {
        // create certificate for each template
        let pending = Promise.resolve();

        // create certificate for each template, one by one, to allow retry
        _.forEach(templates.certificates, (template) => {
          const templateKey = getKey(template, applicationIdentifier);
          if (completed[templateKey]) {
            // skip if already created
            certificates[templateKey] = completed[templateKey];
            return;
          }

          pending = pending.then(() => createCertificate(template, applicationIdentifier))
            .then((res) => {
              const { id: certificateId } = res.body;

              if (!certificateId) {
                throw new ReferenceError('Unexpected resposne from CPS: key attr \'id\' is missing');
              }

              // save results each step
              certificates[templateKey] = certificateId;
            });
        });

        // create feature set with template
        return pending;
      })
      .then(() => {
        // all certificates creation at cps completed
        cb(null, { done: true, certificates: JSON.stringify(certificates) });
      })
      .catch((err) => {
        // handle error with task results
        cb(err, { done: false, certificates: JSON.stringify(certificates) });
      });
  }
  return createTask('CERTIFICATION_CREATION', run, { validateRerun }, logger);
}

export default createCertificationCreationTask;
