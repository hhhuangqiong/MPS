import { describe, it } from 'mocha';
import { expect } from 'chai';
import { internet } from 'faker';

import expectNotExist from '../../lib/expectNotExist';
import missingRequiredField from '../../lib/missingRequiredField';
import httpStatusError from '../../lib/httpStatusError';

import container from '../../../src/ioc';
const { carrierCreationRequest } = container.carrierManagement;

describe('Carrier Creation Request', () => {
  describe('validation', () => {
    const identifier = internet.domainName();

    it('should not pass validation for missing props "alias"', () => (
      carrierCreationRequest({})
        .then(expectNotExist)
        .catch(missingRequiredField('alias'))
    ));

    it('should not pass validation for missing props "identifier"', () => (
      carrierCreationRequest({
        alias: identifier,
      })
        .then(expectNotExist)
        .catch(missingRequiredField('identifier'))
    ));
  });

  describe('response', () => {
    const identifier = internet.domainName();

    it('should success for an unique carrier identifier"', () => (
      carrierCreationRequest({ identifier, alias: identifier })
        .then(response => expect(response.body.id).to.equal(identifier))
        .catch(expectNotExist)
    ));

    it('should fail for provisioning same carrier identifier"', () => (
      carrierCreationRequest({ identifier, alias: identifier })
        .then(expectNotExist)
        .catch(httpStatusError(400, 'Carrier already exists.', 35000))
    ));
  });
});
