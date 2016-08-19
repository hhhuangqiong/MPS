import _ from 'lodash';
import { NotImplementedError, ArgumentNullError } from 'common-errors';

import ioc from '../../ioc';
import { createTask } from '../util/task';

const FeatureSetManagement = ioc.container.FeatureSetManagement;

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

  // use default feature set template if reselleCarrierId is not provided
  // @todo
  if (!resellerCarrierId) {
    cb(new NotImplementedError('Non-reseller provisioning is not implemented yet'));
    return;
  }

  // get feature set template by resller carrier id, i.e. use resellerCarrierId
  // as group
  FeatureSetManagement.getFeatureSetTemplate(resellerCarrierId)
    .then((res) => {
      const template = res.body;
      if (!template.group || !_.isArray(template.features)) {
        throw new ReferenceError('Unexpected response from CPS: key attr \'group\' missing');
      }

      // get identifiers from the feature set templates;
      const featureSet = generateFeatureSetFromTemplate(carrierId, template);

      // create feature set with template
      return FeatureSetManagement.createFeatureSet(featureSet);
    })
    .then((res) => {
      const { id: featureSetId } = res.body;

      if (!featureSetId) {
        throw new ReferenceError('Unexpected resposne from CPS: key attr \'id\' is missing');
      }

      cb(null, { featureSetId });
    })
    .catch(cb);
}

export default createTask('CREATE_FEATURE_SET', run, { validateRerun });
