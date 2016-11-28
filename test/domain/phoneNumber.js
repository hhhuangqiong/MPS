import { expect } from 'chai';

import { translateTo10DigitOffnetPrefix } from '../../src/domain';

describe('domain/phoneNumber', () => {
  describe('translateTo10DigitOffnetPrefix', () => {
    it('translates from the prefix with less than 10 digits to 10 digit offnet prefix with padding zeros', () => {
      expect(translateTo10DigitOffnetPrefix('246000')).to.equal('0000246000');
    });

    it('translates from the prefix with leading plus to 10 digit offnet prefix with padding zeros', () => {
      expect(translateTo10DigitOffnetPrefix('+00246001')).to.equal('0000246001');
    });
  });
});
