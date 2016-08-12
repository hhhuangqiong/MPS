import ioc from '../../../ioc';
import { ValidationError, ArgumentError, NotImplementedError } from 'common-errors';

const { createCarrier } = ioc.container;
const cpsConfig = ioc.container['config.cps'];

const WLP_SERVICE_DOMAIN = cpsConfig.wlServiceDomain;
const SDK_SERVICE_DOMAIN = cpsConfig.sdkServiceDomain;

const TASK_NAME = 'CARRIER_CREATION';
/**
 * Function to validate whether the profile is invalid for current process
 * @param  {Object} profile     Provisoning profile
 * @param  {Object} taskResults latest task results
 * @return {[type]}             [description]
 */
function validateProfile(profile, taskResults) {
  if (taskResults[TASK_NAME].alias !== profile.companyCode) {
    throw new ValidationError('Company code cannot be updated', 'FIELD_IN_SERVICE', 'profile.companyCode')
  }
  return true;
}

export default function carrierCreation(data, done) {
  const { profile } = data;

  // check if this task is done as of previous process task result
  // skip this task if success
  const taskResult = this.getProperty('taskResults')[TASK_NAME];
  if (taskResult.alias === profile.companyCode) {
    done(data);
    return;
  }

  let topDomain;
  switch (profile.serviceType) {
    case 'wl':
      topDomain = WLP_SERVICE_DOMAIN;
      break;
    case 'sdk':
      topDomain = SDK_SERVICE_DOMAIN;
      break;
    case 'lc':
      throw new NotImplementedError('Live Connect provisioning not implemented yet');
    default:
      throw new ArgumentError('profile.serviceType');
  }

  const carrierId = `${profile.companyCode}.${topDomain}`;
  const status = {
    service: 'carrierCreation',
    request: {
      identifier: carrierId,
      alias: profile.companyCode,
    },
  };

  createCarrier(status.request)
    .then(response => {
      const payload = {
        response: response && response.body,
      };

      const taskResults = data.taskResults[TASK_NAME];
      taskResults[TASK_NAME] = payload;
      done(data);
    })
    .catch(error => {
      const taskErrors = data.taskErrors[TASK_NAME];
      taskErrors[TASK_NAME] = error;
      done(data);
    });
}

carrierCreation.name = TASK_NAME;
carrierCreation.validateProfile = validateProfile;
