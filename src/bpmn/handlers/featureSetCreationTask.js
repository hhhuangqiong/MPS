import _ from 'lodash';
import { ArgumentNullError } from 'common-errors';
import { check } from 'm800-util';

import { FEATURE_SET_CREATION } from './bpmnEvents';

export function createFeatureSetCreationTask(featureSetManagement) {
  check.ok('featureSetManagement', featureSetManagement);

  function generateFeatureSetFromTemplate(carrierId, template) {
    const identifier = `${carrierId}.feature-set`;
    const features = _.map(template.features, feature => ({ identifier: feature.identifier }));

    return {
      identifier,
      features,
    };
  }

  async function createFeatureSet(state, profile) {
    if (state.results.featureSetId) {
      return null;
    }
    const { carrierId } = state.results;
    const { resellerCarrierId } = profile;

    if (!carrierId) {
      throw new ArgumentNullError('carrierId');
    }
    if (!resellerCarrierId) {
      throw new ArgumentNullError('resellerCarrierId');
    }

    let res = await featureSetManagement.getFeatureSetTemplate(resellerCarrierId);
    const template = res.body;
    if (!template.group || !_.isArray(template.features)) {
      throw new ReferenceError('Unexpected response from CPS: key attr \'group\' missing');
    }
    // get identifiers from the feature set templates;
    const featureSet = generateFeatureSetFromTemplate(carrierId, template);
    // create feature set with template
    res = await featureSetManagement.createFeatureSet(featureSet);
    const { id: featureSetId } = res.body;
    if (!featureSetId) {
      throw new ReferenceError('Unexpected resposne from CPS: key attr \'id\' is missing');
    }
    const featureSetIdentifier = featureSet.identifier;

    return {
      results: {
        featureSetId,
        featureSetIdentifier,
      },
    };
  }

  createFeatureSet.$meta = {
    name: FEATURE_SET_CREATION,
  };

  return createFeatureSet;
}

export default createFeatureSetCreationTask;
