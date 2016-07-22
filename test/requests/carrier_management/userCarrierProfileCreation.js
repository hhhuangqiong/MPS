import { describe, it } from 'mocha';
import { expect } from 'chai';
import container from '../../../src/ioc';

const { userCarrierProfileCreationRequest } = container.carrierManagement;

describe('carrierProfileCreationRequest', () => {
  describe('Validation', () => {
    it('should not pass validation for missing props "carrierId"', () => (
      userCarrierProfileCreationRequest({})
        .catch(error => {
          expect(error.message).to.equal('"carrierId" is required');
        })
    ));
  });

  describe('Response', () => {
    // Test with an existing carrier Id
    const carrierId = 'example.com';

    it('should response an unique id', () => (
      userCarrierProfileCreationRequest({ carrierId })
        .then(response => {
          expect(response.body.id).to.exist;
        })
    ));

    it('should response correctly for SME', () => (
      userCarrierProfileCreationRequest({
        carrierId,
        attributes: {
          'com|maaii|service|voip|ice|disabled': 'true',
          'com|maaii|service|voip|enabled': 'true',
          'com|maaii|user|type|preapaid': 'true',
          'com|maaii|application|credit|upperlimit': '-1',
          'com|maaii|application|earning|Email|amount': '0.3',
          'com|maaii|application|earning|FBpost|amount': '0.3',
          'com|maaii|application|earning|Twitterpost|amount': '0.3',
          'com|maaii|application|earning|WBpost|amount': '0.3',
          'com|maaii|application|earning|enabled': 'false',
          'com|maaii|application|earning|random|enabled': 'true',
          'com|maaii|application|earning|rateus|amount': '0.3',
          'com|maaii|application|earning|smsinvite|amount': '1',
          'com|maaii|service|voip|packetlossthreshold': '7',
        },
      })
        .then(response => {
          expect(response.body.id).to.exist;
        })
    ));
  });
});
