import { describe, it } from 'mocha';
import { expect } from 'chai';
import { internet } from 'faker';
import container from '../../../src/ioc';

const { carrierCreationRequest } = container.carrierManagement;

describe('carrierCreationRequest', () => {
  describe('Validation', () => {
    it('should not pass validation for missing props "identifier"', () => (
      carrierCreationRequest({})
        .catch(error => expect(error.message).to.equal('"identifier" is required'))
    ));
  });

  describe('Response', () => {
    const carrierId = internet.domainName();

    it('should response success for an unique carrier identifier"', () => (
      carrierCreationRequest({
        identifier: carrierId,
      })
      .then(response => {
        expect(response.body.id).to.equal(carrierId);
      })
    ));

    it('should response fail for provisioning same carrier identifier"', () => (
      carrierCreationRequest({
        identifier: carrierId,
      })
      .catch(error => {
        expect(error.code).to.equal(35000);
        expect(error.message).to.equal('Carrier already exists.');
      })
    ));
  });
});
