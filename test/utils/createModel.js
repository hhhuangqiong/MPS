import { describe, it } from 'mocha';
import { expect } from 'chai';

import createModel from '../../src/utils/createModel';

describe('utils/createModel', () => {
  describe('Validation', () => {
    it('should fail when schema is empty', () => {
      try {
        createModel();
      } catch (error) {
        expect(error).to.exist;
        expect(error.name).to.equal('ArgumentNullError');
        expect(error.argumentName).to.equal('schema');
      }
    });

    it('should fail when schema is not an object', () => {
      try {
        createModel('I am a string');
      } catch (error) {
        expect(error).to.exist;
        expect(error.name).to.equal('TypeError');
      }
    });
  });

  it('should be an instance of model object', () => {
    expect(createModel({ schemaKey: String })).to.be.instanceof(Object);
  });
});
