import _ from 'lodash';

import { getProperty, setProperty } from './util';

export function createTaskEndHandler(logger) {
  return function onEnd(currentFlowObjectName, data, done) {
    const { taskResults, taskErrors } = data;
    const taskResult = taskResults && taskResults[currentFlowObjectName];
    const taskError = taskErrors && taskErrors[currentFlowObjectName];

    const ownerId = getProperty(this, 'ownerId');

    if (!taskResult && !taskError) {
      logger.info(`[${ownerId}] Task ${currentFlowObjectName} ended.`);
      // most likely not a (wrapped) task, ignores
      done(data);
      return;
    }

    if (taskError) {
      logger.info(`[${ownerId}] Task ${currentFlowObjectName} ends with error`, taskError);

      // persist errors into process property
      const errors = getProperty(this, 'taskErrors') || {};
      errors[currentFlowObjectName] = taskError;
      setProperty(this, 'taskErrors', errors);
    } else {
      logger.info(`[${ownerId}] Task ${currentFlowObjectName} ends with result: `, taskResult);

      // flatten result into data for next process tasks
      // NOTE: tasks must result object as a result. process task should be
      // designed to avoid same result properties are used across task
      _.assign(data, taskResult);

      const results = getProperty(this, 'taskResults') || {};
      results[currentFlowObjectName] = taskResult;
      setProperty(this, 'taskResults', results);
    }
    done(data);
  };
}

export default createTaskEndHandler;
