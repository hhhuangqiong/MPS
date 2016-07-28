import { describe, it } from 'mocha';
import { expect } from 'chai';
import { internet } from 'faker';

import expectNotExist from '../../lib/expectNotExist';
import missingRequiredField from '../../lib/missingRequiredField';
import httpStatusError from '../../lib/httpStatusError';

import container from '../../../src/ioc';
const { carrierCreationRequest } = container.carrierManagement;

describe('carrierCreationRequest', () => {
  describe('Validation', () => {
    it('should not pass validation for missing props "identifier"', () => (
      carrierCreationRequest({})
        .then(expectNotExist)
        .catch(missingRequiredField('identifier'))
    ));
  });

  describe('Response', () => {
    const identifier = internet.domainName();

    it('should success for an unique carrier identifier"', () => (
      carrierCreationRequest({ identifier })
        .then(response => expect(response.body.id).to.equal(identifier))
        .catch(expectNotExist)
    ));

    it('should fail for provisioning same carrier identifier"', () => (
      carrierCreationRequest({ identifier })
        .then(expectNotExist)
        .catch(httpStatusError(400, 'Carrier already exists.', 35000))
    ));
  });
});
