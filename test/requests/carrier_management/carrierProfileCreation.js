import { describe, it } from 'mocha';
import { expect } from 'chai';
import { random } from 'faker';
import container from '../../../src/ioc';

const { carrierProfileCreationRequest } = container.carrierManagement;

describe('carrierProfileCreationRequest', () => {
  describe('Validation', () => {
    it('should not pass validation for missing props "carrierId"', () => (
      carrierProfileCreationRequest({})
        .catch(error => {
          expect(error.message).to.equal('"carrierId" is required');
        })
    ));
  });

  describe('Response', () => {
    // Test with an existing carrier Id
    const carrierId = 'example.com';

    it('should response an unique id', () => (
      carrierProfileCreationRequest({ carrierId })
        .then(response => {
          expect(response.body.id).to.exist;
        })
    ));

    it('should response correctly for SME', () => {
      const prefix = random.number().toString();

      return carrierProfileCreationRequest({
        carrierId,
        attributes: {
          'com|maaii|integration|ims|domain|prefix': prefix,
          'com|maaii|management|validation|sms|code|length': '3',
          'com|maaii|im|group|participant|max': '20',
          'com|maaii|service|voip|route': 'mss',
        },
      })
        .then(response => {
          expect(response.body.id).to.exist;
        });
    });
  });
});
