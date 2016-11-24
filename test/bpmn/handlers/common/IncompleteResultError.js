import { expect } from 'chai';
import { Error } from 'common-errors';

import { IncompleteResultError } from '../../../../src/bpmn/handlers/common/IncompleteResultError';

describe('bpmn/handlers/common/IncompleteResultError', () => {
  it('creates an incomplete result error and we can get the update the messages', () => {
    const updates = {
      results: {
        id: 1,
        anotherId: 2,
      },
    };
    const error = new Error('test');
    const incompleteResultError = new IncompleteResultError(updates, error);
    expect(incompleteResultError.updates).to.equal(updates);
    expect(incompleteResultError.message).to.contain(error.message);
  });
});
