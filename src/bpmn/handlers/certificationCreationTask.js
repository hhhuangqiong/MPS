import _ from 'lodash';
import { ArgumentNullError } from 'common-errors';
import { check } from 'm800-util';

import { IncompleteResultError } from './common';
import { CERTIFICATION_CREATION } from './bpmnEvents';

export function createCertificationCreationTask(certificateManagement) {
  check.ok('certificateManagement', certificateManagement);

  function getKey(template, applicationIdentifier) {
    return `${applicationIdentifier}:${template.platform_id}:${template.type}`;
  }

  function createCertificate(template, applicationIdentifier) {
    const certificate = _.clone(template);
    certificate.application_identifier = applicationIdentifier;
    return certificateManagement.create(certificate);
  }

  async function createCertificates(state, profile) {
    if (state.results.certificatesCreated) {
      return null;
    }
    const { resellerCarrierId } = profile;
    const { applicationIdentifier, certificates: previousCertificates } = state.results;
    let currentCertificates = previousCertificates;

    if (!applicationIdentifier) {
      throw new ArgumentNullError('applicationIdentifier');
    }

    if (!resellerCarrierId) {
      throw new ArgumentNullError('resellerCarrierId');
    }

    let res = await certificateManagement.getTemplates(resellerCarrierId);
    const templates = res.body;
    if (!templates.group || !_.isArray(templates.certificates)) {
      throw new ReferenceError('Unexpected response from CPS: key attr \'group\' missing');
    }
    const certificatesByTemplateId = _.keyBy(currentCertificates, x => x.templateId);
    const certificateTemplates = templates.certificates
      .filter(t => !certificatesByTemplateId[getKey(t, applicationIdentifier)]);
    let error = null;
    try {
      for (const certificateTemplate of certificateTemplates) {
        const templateKey = getKey(certificateTemplate, applicationIdentifier);
        res = await createCertificate(certificateTemplate, applicationIdentifier);
        const { id: certificateId } = res.body;
        if (!certificateId) {
          throw new ReferenceError('Unexpected resposne from CPS: key attr \'id\' is missing');
        }
        currentCertificates = (currentCertificates || []).concat([{
          templateId: templateKey,
          certificateId,
        }]);
      }
    } catch (e) {
      error = e;
    }
    let updates = null;
    if (currentCertificates !== previousCertificates) {
      updates = {
        results: {
          certificates: currentCertificates,
          certificatesCreated: !error,
        },
      };
    }
    if (error) {
      throw new IncompleteResultError(updates, error);
    }
    return updates;
  }

  createCertificates.$meta = {
    name: CERTIFICATION_CREATION,
  };

  return createCertificates;
}

export default createCertificationCreationTask;
