import { describe, it } from 'mocha';

import {
  expectNotExist,
  missingRequiredField,
  expectPathExist,
} from '../../expectValidator';


import CarrierManagement from '../../../src/requests/CarrierManagement';
const carrierManagement = new CarrierManagement('http://192.168.118.23:9000');

describe('carrierManagement.createCarrierProfile', () => {
  describe('Validation', () => {
    it('should not pass validation for missing props "carrierId"', () => (
      carrierManagement.createCarrierProfile({})
        .then(expectNotExist)
        .catch(missingRequiredField('carrierId'))
    ));
  });

  describe('Response', () => {
    // Test with an existing carrier Id
    const carrierId = 'example.com';

    it('should response an unique id', () => (
      carrierManagement.createCarrierProfile({ carrierId })
        .then(expectPathExist('body.id'))
        .catch(expectNotExist)
    ));

    it('should response correctly for SME', () => {
      const params = {
        carrierId,
        attributes: {
          'com|maaii|management|validation|sms|code|length': '3',
          'com|maaii|im|group|participant|max': '20',
          'com|maaii|service|voip|route': 'mss',
        },
      };

      return carrierManagement.createCarrierProfile(params)
        .then(expectPathExist('body.id'))
        .catch(expectNotExist);
    });
  });
});
