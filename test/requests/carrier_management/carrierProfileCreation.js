import { describe, it } from 'mocha';
import { random } from 'faker';

import container from '../../../src/ioc';
import expectPathExist from '../../lib/expectPathExist';
import expectNotExist from '../../lib/expectNotExist';
import missingRequiredField from '../../lib/missingRequiredField';

const { carrierProfileCreationRequest } = container.carrierManagement;

describe('carrierProfileCreationRequest', () => {
  describe('Validation', () => {
    it('should not pass validation for missing props "carrierId"', () => (
      carrierProfileCreationRequest({})
        .then(expectNotExist)
        .catch(missingRequiredField('carrierId'))
    ));
  });

  describe('Response', () => {
    // Test with an existing carrier Id
    const carrierId = 'example.com';

    it('should response an unique id', () => (
      carrierProfileCreationRequest({ carrierId })
        .then(expectPathExist('body.id'))
        .catch(expectNotExist)
    ));

    it('should response correctly for SME', () => {
      const prefix = random.number().toString();
      const params = {
        carrierId,
        attributes: {
          'com|maaii|integration|ims|domain|prefix': prefix,
          'com|maaii|management|validation|sms|code|length': '3',
          'com|maaii|im|group|participant|max': '20',
          'com|maaii|service|voip|route': 'mss',
        },
      };

      return carrierProfileCreationRequest(params)
        .then(expectPathExist('body.id'))
        .catch(expectNotExist);
    });
  });
});
