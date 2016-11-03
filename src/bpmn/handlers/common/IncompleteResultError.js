import { helpers } from 'common-errors';

export const IncompleteResultError = helpers.generateClass('IncompleteResultError', {
  globalize: false,
  args: ['updates', 'inner_error'],
  generateMessage() {
    return `The task was not completely successful. ${this.inner_error.message}.`;
  },
});

export default IncompleteResultError;
