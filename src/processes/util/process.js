import uuid from 'uuid';
import _ from 'lodash';
import logger from '../../utils/logger';

function getTaskResults(process) {
  const taskResults = process.getProperty('taskResults');
  if (!taskResults) return {};

  try {
    return JSON.parse(taskResults) || {};
  } catch (e) {
    logger.warning('Unable to deserialize taskResults from process', taskResults, e.stack);
    return {};
  }
}

function setTaskResults(process, taskResults) {
  try {
    process.setProperty('taskResults', JSON.stringify(taskResults));
  } catch (e) {
    logger.warning('Unable to serialize taskResults to process:', taskResults, e.stack);
  }
}

function getTaskErrors(process) {
  const taskErrors = process.getProperty('taskErrors');
  if (!taskErrors) return {};

  try {
    return JSON.parse(taskErrors) || {};
  } catch (e) {
    logger.warning('Unable to deserialize taskErrors from process.', taskErrors, e.stack);
    return {};
  }
}

function setTaskErrors(process, taskErrors) {
  try {
    process.setProperty('taskErrors', JSON.stringify(taskErrors));
  } catch (e) {
    logger.warning('Unable to serialize taskErrors to process:', taskErrors, e.stack);
  }
}

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
          logger.info('process start');

          done(data);
        },
        [endEventName](data, done) {
          logger.info('process end');

          const taskResults = getTaskResults(this);
          const taskErrors = getTaskErrors(this);
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
          logger.info(`Handler not found for event ${currentFlowObjectName}:${handlerName}<${eventType}>`);
            // Called, if no handler could be invoked.
          done({});
        },
        defaultErrorHandler(error, done) {
          logger.info('error caught within task ', error.stack);
          const taskErrors = { UNKNOWN_TASK: error };
          // set as taskErrors for tasks beyond this point
          done({ taskErrors });
        },
        onBeginHandler(currentFlowObjectName, data, done) {
          logger.info(`Task ${currentFlowObjectName} begins`);
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
          const taskError = taskErrors && taskErrors[currentFlowObjectName];

          if (!taskResult && !taskError) {
            logger.info(`Task ${currentFlowObjectName} ended.`);
            // most likely not a (wrapped) task, ignores
            done(data);
            return;
          }

          if (taskError) {
            logger.info(`Task ${currentFlowObjectName} ends with error`, taskError);

            // persist errors into process property
            const errors = getTaskErrors(this);
            errors[currentFlowObjectName] = taskError;
            setTaskErrors(this, errors);
          } else {
            logger.info(`Task ${currentFlowObjectName} ends with result: `, taskResult);

            // flatten result into data for next process tasks
            // NOTE: tasks must result object as a result. process task should be
            // designed to avoid same result properties are used across task
            _.assign(data, taskResult);

            const results = getTaskResults(this);
            results[currentFlowObjectName] = taskResult;
            setTaskResults(this, results);
          }
          done(data);
        },
      })
    );
  } catch (e) {
    logger.emerg('Error loading bpmn into engine: ', e.stack);
  }

  /**
   * Loop through all tasks to validate on input profile, if interface of validateProfile
   * has been impl.
   * @param  {Object} data   Input data
   * @param  {Object} taskResults Container of in service attributes, empty if first time process runs
   * @throws {ValidationError}   Validation error on specific field of profile
   */
  function validateRerun(data, taskResults) {
    _.forEach(taskResults, (taskResult, key) => {
      const processHandler = processHandlers[key];
      if (processHandler && processHandler.validateRerun) {
        processHandler.validateRerun(data, taskResult);
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

    // seralize results into process for rerun
    setTaskResults(process, taskResults);

    process.triggerEvent(startEventName, data);

    return processId;
  }

  return { run, setCompleteHandler };
}
