import _ from 'lodash';
import { ArgumentNullError } from 'common-errors';

import { check, createTask } from './util';

export function createFeatureSetCreationTask(logger, featureSetManagement) {
  check.ok('logger', logger);
  check.ok('featureSetManagement', featureSetManagement);

  function validateRerun(data, taskResult) {
    if (taskResult.featureSetId) {
      // feature set already created, skip
      return false;
    }

    return true;
  }


  function generateFeatureSetFromTemplate(carrierId, template) {
    const identifier = `${carrierId}.feature-set`;
    const features = _.map(template.features, feature => ({ identifier: feature.identifier }));

    return {
      identifier,
      features,
    };
  }

  function run(data, taskResult, cb) {
    const { resellerCarrierId, carrierId } = data;

    if (!carrierId) {
      cb(new ArgumentNullError('carrierId'));
      return;
    }

    if (!resellerCarrierId) {
      cb(new ArgumentNullError('resellerCarrierId'));
      return;
    }

    let featureSet;

    // get feature set template by resller carrier id, i.e. use resellerCarrierId
    // as group
    featureSetManagement.getFeatureSetTemplate(resellerCarrierId)
      .then((res) => {
        const template = res.body;
        if (!template.group || !_.isArray(template.features)) {
          throw new ReferenceError('Unexpected response from CPS: key attr \'group\' missing');
        }

        // get identifiers from the feature set templates;
        featureSet = generateFeatureSetFromTemplate(carrierId, template);

        // create feature set with template
        return featureSetManagement.createFeatureSet(featureSet);
      })
      .then((res) => {
        const { id: featureSetId } = res.body;

        if (!featureSetId) {
          throw new ReferenceError('Unexpected resposne from CPS: key attr \'id\' is missing');
        }

        const featureSetIdentifier = featureSet.identifier;
        cb(null, { featureSetId, featureSetIdentifier });
      })
      .catch(cb);
  }

  return createTask('FEATURE_SET_CREATION', run, { validateRerun }, logger);
}

export default createFeatureSetCreationTask;
