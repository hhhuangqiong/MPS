import { describe, it } from 'mocha';
import { expect } from 'chai';

import {
  expectNotExist,
  missingRequiredField,
} from '../expectValidator';

import container from '../../src/ioc';

const {
  getFeatureSetTemplateRequest,
  createFeatureSetRequest,
} = container.featureSetManagementFactory;

describe('Feature Set Management', () => {
  describe('Get Feature Set Template', () => {
    it('should not pass validation for missing arg "group"', () => (
      getFeatureSetTemplateRequest()
        .then(expectNotExist)
        .catch(error => {
          expect(error).to.exist;
          expect(error.name).to.equal('ValidationError');
          expect(error.field).to.equal('group');
        })
    ));

    it('HTTP 404 Not Found', () => (
      getFeatureSetTemplateRequest('sparkleSME')
        .then(expectNotExist)
        .catch(error => {
          expect(error).to.exist;
          expect(error.name).to.equal('NotFoundError');
          expect(error.code).to.equal(21000);
        })
    ));
  });

  describe('Set Feature Set', () => {
    it('should not pass validation for missing identifier', () => (
      createFeatureSetRequest()
        .then(expectNotExist)
        .catch(missingRequiredField('identifier'))
    ));

    it('should not pass validation for missing features', () => (
      createFeatureSetRequest({ identifier: 'example.com' })
        .then(expectNotExist)
        .catch(missingRequiredField('features'))
    ));
  });
});
