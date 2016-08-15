import { describe, it } from 'mocha';
import { expect } from 'chai';
import { internet } from 'faker';

import {
  expectNotExist,
  missingRequiredField,
  httpStatusError,
} from '../../expectValidator';

import CarrierManagement from '../../../src/requests/CarrierManagement';
const carrierManagement = new CarrierManagement('http://192.168.118.23:9000');

describe('carrierManagement.createCarrier', () => {
  describe('validation', () => {
    const identifier = internet.domainName();

    it('should not pass validation for missing props "alias"', () => (
      carrierManagement.createCarrier({})
        .then(expectNotExist)
        .catch(missingRequiredField('alias'))
    ));
  });

  describe('response', () => {
    const identifier = internet.domainName();

    it('should success for an unique carrier identifier"', () => (
      carrierManagement.createCarrier({ identifier, name: identifier, alias: identifier })
        .then(response => expect(response.body.id).to.equal(identifier))
        .catch(expectNotExist)
    ));

    it('should fail for provisioning same carrier identifier"', () => (
      carrierManagement.createCarrier({ identifier, name: identifier, alias: identifier })
        .then(expectNotExist)
        .catch(httpStatusError(400, 'Carrier already exists.', 50101))
    ));
  });
});
