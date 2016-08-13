import uuid from 'uuid';
import _ from 'lodash';
import logger from '../../utils/logger';

/**
 * Helper module to integrate with processManager
 */
export function addProcess({ processManager, processPath, processHandlers, startEventName, endEventName }) {
  let onProcessComplete;
  function setCompleteHandler(handler) {
    onProcessComplete = handler;
  }

  try {
    processManager.addBpmnFilePath(
      processPath,
      _.extend(processHandlers, {
        [startEventName](data, done) {
          logger('info', 'process start');

          done(data);
        },
        [endEventName](data, done) {
          logger('info', 'process end');

          const taskResults = this.getProperty('taskResults');
          const taskErrors = this.getProperty('taskErrors');
          const ownerId = this.getProperty('ownerId');

          if (onProcessComplete) {
            onProcessComplete(
              {
                ownerId,
                taskErrors,
                taskResults,
              }
            );
          }
          done(data);
        },
        defaultEventHandler(eventType, currentFlowObjectName, handlerName, reason, done) {
          logger(`Handler not found for event ${currentFlowObjectName}:${handlerName}<${eventType}>`);
            // Called, if no handler could be invoked.
          done();
        },
        defaultErrorHandler(error, done) {
          logger('error', error.stack);
          done();
        },
        onBeginHandler(currentFlowObjectName, data, done) {
          logger(`Task ${currentFlowObjectName} begins with data`, data);
          done(data);
        },
        /**
         * On each task end, flatten the successful task results for next task.
         * Persitency the results and errors
         *
         * @param  {[type]}   currentFlowObjectName [description]
         * @param  {[type]}   data                  [description]
         * @param  {Function} done                  [description]
         * @return {[type]}                         [description]
         */
        onEndHandler(currentFlowObjectName, data, done) {
          const { taskResults, taskErrors } = data;
          const taskResult = taskResults && taskResults[currentFlowObjectName];
          if (!taskResult) {
            // most likely not a (wrapped) task, ignores
            done(data);
            return;
          }

          const taskError = taskErrors && taskErrors[currentFlowObjectName];
          if (taskError) {
            logger(`Task ${currentFlowObjectName} ends with error`, taskError);

            // persist errors into process property
            const processErrors = this.getProperty('taskErrors') || {};
            processErrors[currentFlowObjectName] = taskError;
            _.assign(processErrors, taskErrors);
            this.setProperty('taskErrors', processErrors);
          } else {
            logger(`Task ${currentFlowObjectName} ends with result: `, taskResult);

            // flatten result into data for next process tasks
            // NOTE: tasks must result object as a result. process task should be
            // designed to avoid same result properties are used across task
            _.assign(data, taskResult);

            // presist erros into process property
            const processResults = this.getProperty('taskResults') || {};
            processResults[currentFlowObjectName] = taskResult;
            this.setProperty('taskResults', processResults);
          }
          done(data);
        },
      })
    );
  } catch (e) {
    logger('fatal', 'Error loading bpmn into engine: ', e.stack);
  }

  /**
   * Loop through all tasks to validate on input profile, if interface of validateProfile
   * has been impl.
   * @param  {Object} data   Input data
   * @param  {Object} taskResults Container of in service attributes, empty if first time process runs
   * @throws {ValidationError}   Validation error on specific field of profile
   */
  function validateRerun(data, taskResults) {
    _.forEach(taskResults, (value, key) => {
      const processHandler = processHandlers[key];
      if (processHandler && processHandler.validateRerun) {
        processHandler.validateRerun(data, taskResults);
      }
    });
  }

  function generateProcessId() {
    return uuid.v4();
  }

  /**
   * Trigger process start using process manager
   */
  async function run(ownerId, data, taskResults) {
    if (taskResults) {
      validateRerun(data, taskResults);
    }

    const processId = generateProcessId();
    const process = await processManager.createProcessAsync(processId);

    process.setProperty('ownerId', ownerId);
    process.setProperty('taskResults', taskResults);
    process.triggerEvent(startEventName, data);
    return processId;
  }

  return { run, setCompleteHandler };
}
