import { describe, it } from 'mocha';

import expectPathExist from '../../lib/expectPathExist';
import expectNotExist from '../../lib/expectNotExist';
import missingRequiredField from '../../lib/missingRequiredField';

import CarrierManagement from '../../../src/requests/CarrierManagement';
const carrierManagement = new CarrierManagement('http://192.168.118.23:9000');

describe('carrierManagement.createUserCarrierProfile', () => {
  describe('Validation', () => {
    it('should not pass validation for missing props "carrierId"', () => (
      carrierManagement.createUserCarrierProfile({})
        .then(expectNotExist)
        .catch(missingRequiredField('carrierId'))
    ));
  });

  describe('Response', () => {
    // Test with an existing carrier Id
    const carrierId = 'example.com';

    it('should response an unique id', () => (
      carrierManagement.createUserCarrierProfile({ carrierId })
        .then(expectPathExist('body.id'))
        .catch(expectNotExist)
    ));

    it('should response correctly for SME', () => {
      const params = {
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
      };

      carrierManagement.createUserCarrierProfile(params)
        .then(expectPathExist('body.id'))
        .catch(expectNotExist);
    });
  });
});
