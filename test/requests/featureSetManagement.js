import { describe, it } from 'mocha';
import { expect } from 'chai';
import container from '../../src/ioc';

const {
  getFeatureSetTemplateRequest,
  createFeatureSetRequest,
} = container.featureSetManagementFactory;

describe('Feature Set Management', () => {
  describe('Get Feature Set Template', () => {
    it('should not pass validation for missing arg "group"', () => (
      getFeatureSetTemplateRequest()
      .catch(error => expect(error.message).to.equal('group is empty'))
    ));

    it('405 Method Not Allowed', () => (
      getFeatureSetTemplateRequest('sparkleSME')
      .then(response => {
        expect(response.error).to.exist;
      })
    ));
  });

  describe('Set Feature Set', () => {
    it('should not pass validation for missing identifier', () => (
      createFeatureSetRequest()
      .catch(error => expect(error.message).to.equal('"identifier" is required'))
    ));

    it('should not pass validation for missing features', () => (
      createFeatureSetRequest({
        identifier: 'example.com',
      })
      .catch(error => expect(error.message).to.equal('"features" is required'))
    ));
  });

});
