import { createTask } from '../util/task';

// for each supported platforms
// - get certificate templates
// - create certificate with template, application id? why save application?

function validateRerun(data, taskResult) {
  return true;
}

function run(data, taskResult, cb) {
  cb(null, { done: true });
}

export default createTask('CERTIFICATION_CREATION', run, { validateRerun });
