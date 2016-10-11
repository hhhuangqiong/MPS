import { ArgumentNullError } from 'common-errors';
import _ from 'lodash';
import { getProperty } from './property';
import { check } from './';

/**
 * Util method to create a task with process rerun validation, and automatic skip
 * if task is done with
 * Standardize the success/failure handling of each task
 * @param {String} name Name of the task in bpmn
 * @param {String} task
 * @param (Object) opts
 * @param {validateRerun} opts.validateRerun
 * @param {Booleans} opts.skipOnPrevErrors
 */
export function createTask(name, task, { validateRerun, skipOnPrevErrors = true }, logger) {
  check.ok('name', name);
  check.ok('task', task);
  check.ok('logger', logger);

  if (!validateRerun) {
    throw new ArgumentNullError('validateRerun');
  }

  function wrappedTask(data, done) {
    const ownerId = getProperty(this, 'ownerId');
    const prevProcessResults = getProperty(this, 'taskResults', {});
    const prevProcessResult = (prevProcessResults && prevProcessResults[name]) || {};

    try {
      if (!validateRerun(data, prevProcessResult)) {
        logger.info(`[${ownerId}] Task ${name} skipped as already completed`);
        data.taskResults = data.taskResults || {};
        data.taskResults[name] = prevProcessResult;
        done(data);
        return;
      }
    } catch (e) {
      logger.info(`[${ownerId}] Task ${name} error:`, e.stack);
      data.taskErrors = data.taskErrors || {};
      data.taskErrors[name] = e;
      done(data);
      return;
    }

    if (skipOnPrevErrors && !_.isEmpty(data.taskErrors)) {
      logger.info(`[${ownerId}] Task ${name} skipped due to previous task errors`);
      done(data);
      return;
    }

    function cb(taskError, taskResult) {
      if (taskError) {
        logger.info(`[${ownerId}] Task ${name} error:`, taskError.stack);
        data.taskErrors = data.taskErrors || {};
        data.taskErrors[name] = taskError;
      }

      if (taskResult) {
        // assign output to data
        data.taskResults = data.taskResults || {};
        data.taskResults[name] = taskResult;
      }

      done(data);
    }

    if (task.length === 3) {
      task(data, prevProcessResult, cb);
    } else {
      task(data, cb);
    }
  }
  /**
   * Function to validate whether the profile is valid for task rerun.
   *
   * Some tasks should avoid to run again or terminate for attempt on profile change.
   * This function is triggered when an task is run with previous completed result.
   *
   * @typedef {Function} validateRerun
   * @param  {Object} profile     Provisoning profile
   * @param  {Object} taskResults Previous successfully completed task results
   * @return {Boolean}            Returns true to rerun, false to skip
   * @throws {ValidationError}    Throws error if process shouldn't be rerun
   */
  wrappedTask.validateRerun = validateRerun;
  return wrappedTask;
}

export default createTask;
