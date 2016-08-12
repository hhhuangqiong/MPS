import { describe, it } from 'mocha';
import { expect } from 'chai';

import {
  expectNotExist,
  missingRequiredField,
} from '../expectValidator';

import FeatureSetManagement from '../../src/requests/FeatureSetManagement';
const featureSetManagement = new FeatureSetManagement('http://192.168.118.23:9000');

describe('Feature Set Management', () => {
  describe('Get Feature Set Template', () => {
    it('should not pass validation for missing arg "group"', () => (
      featureSetManagement
        .getFeatureSetTemplate()
        .then(expectNotExist)
        .catch(error => {
          expect(error).to.exist;
          expect(error.name).to.equal('ValidationError');
          expect(error.field).to.equal('group');
        })
    ));

    it('should not pass validation for missing identifier', () => (
      featureSetManagement
        .createFeatureSet()
        .then(expectNotExist)
        .catch(missingRequiredField('identifier'))
    ));

    it('should receive feature set template', () => (
      featureSetManagement
        .getFeatureSetTemplate('sparkleSME')
        .then(response => {
          expect(response.body).to.exist;
          expect(response.body.group).to.equal('sparkleSME');
          expect(response.body.features.length).to.be.above(1);

          return response.body.features.map(feature => feature.identifier);
        })
        .then(features => {
          featureSetManagement
            .createFeatureSet({
              identifier: 'com.maaii.featureset.maaii_2_6_0',
              features,
            })
            .then(response => {
              expect(response.body).to.exist;
              expect(response.body.id).to.exist;
            })
            .catch(expectNotExist);
        })
        .catch(expectNotExist)
    ));
  });
});
