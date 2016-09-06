import logger from '../../utils/logger';


export function getProperty(process, prop, defaultVal) {
  const val = process.getProperty(prop);
  if (!val) return defaultVal;

  try {
    return JSON.parse(val) || defaultVal;
  } catch (e) {
    logger.warning('Unable to deserialize taskResults from process', val, e.stack);
    return defaultVal;
  }
}

export function setProperty(process, prop, val) {
  try {
    process.setProperty(prop, JSON.stringify(val));
  } catch (e) {
    logger.warning('Unable to serialize taskResults to process:', val, e.stack);
  }
}


function getTaskResults(process) {

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
