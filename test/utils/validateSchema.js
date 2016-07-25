import Joi from 'joi';
import { describe, it } from 'mocha';
import { expect } from 'chai';

import validateSchema from '../../src/utils/validateSchema';

describe('utils/validateSchema', () => {
  describe('No Error', () => {
    it('should have no error for nothing input', () => {
      expect(validateSchema()).to.be.undefined;
    });

    it('should have no error for current rules', () => {
      const params = {
        name: 'M800',
      };

      const rules = {
        name: Joi.string(),
      };

      const result = validateSchema(params, rules);

      expect(result).to.be.undefined;
    });
  });

  describe('Show Error', () => {
    it('should have error for no rules input', () => {
      const params = {
        name: 'M800',
      };

      const result = validateSchema(params);

      expect(result).to.exist;
      expect(result.path).to.equal('name');
      expect(result.type).to.equal('object.allowUnknown');
    });

    it('should have error for missing required field', () => {
      const rules = {
        name: Joi.string().required(),
      };

      const result = validateSchema({}, rules);

      expect(result).to.exist;
      expect(result.path).to.equal('name');
      expect(result.type).to.equal('any.required');
    });
  });
});
