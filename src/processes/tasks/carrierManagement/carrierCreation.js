import ioc from '../../../ioc';
import logger from '../../../utils/logger';
import { createTask } from '../../util/task';
import { ValidationError, ArgumentError, NotImplementedError, ReferenceError } from 'common-errors';
import { ServiceTypes } from '../../../models/Provisioning';


const CarrierManagement = ioc.container.CarrierManagement;
const cpsConfig = ioc.container.config.cps;

const WLP_SERVICE_DOMAIN = cpsConfig.wlServiceDomain;
const SDK_SERVICE_DOMAIN = cpsConfig.sdkServiceDomain;

function generateCarrierId(companyCode, serviceType) {
  let topDomain;
  switch (serviceType) {
    case ServiceTypes.WHITE_LABEL:
      topDomain = WLP_SERVICE_DOMAIN;
      break;
    case ServiceTypes.SDK:
      topDomain = SDK_SERVICE_DOMAIN;
      break;
    case ServiceTypes.LIVE_CONNECT:
      throw new NotImplementedError('LiveConnect provisioning not implemented yet');
    default:
      throw new ArgumentError('profile.serviceType');
  }

  return `${companyCode}.${topDomain}`;
}

function validateRerun(profile, taskResult) {
  if (!taskResult.carrierId) {
    // never run successfully before
    return true;
  }

  const carrierId = generateCarrierId(profile.companyCode, profile.serviceType);
  if (taskResult.carrierId !== carrierId) {
    throw new ValidationError('Company code cannot be updated', 'FIELD_IN_SERVICE', 'profile.companyCode')
  }

  return false;
}


function run(data, cb) {
  const { companyCode, serviceType } = data;

  const carrierId = generateCarrierId(companyCode, serviceType);
  const params = {
    identifier: carrierId,
    alias: companyCode,
  };

  logger('debug', 'CPS create Carrier request sent');
  CarrierManagement.createCarrier(params)
    .then(response => {
      logger('debug', 'CPS create Carrier response received');
      const { id } = response.body;

      if (!id) {
        throw new ReferenceError('id is not defined in response body for carrier creation');
      }

      cb(null, { carrierId: id });
    })
    .catch(cb);
}

export default createTask('CARRIER_CREATION', run, { validateRerun });
