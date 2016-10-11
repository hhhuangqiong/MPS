import { ArgumentError, NotImplementedError, ReferenceError } from 'common-errors';

import { check, createTask } from './util';
import {
  ServiceType,
} from './../../domain';

export function createCarrierCreationTask(logger, cpsOptions, carrierManagement) {
  check.ok('logger', logger);
  check.ok('cpsOptions', cpsOptions);
  check.ok('carrierManagement', carrierManagement);

  const WLP_SERVICE_DOMAIN = cpsOptions.wlServiceDomain;
  const SDK_SERVICE_DOMAIN = cpsOptions.sdkServiceDomain;

  function generateCarrierId(companyCode, serviceType) {
    let topDomain;
    switch (serviceType) {
      case ServiceType.WHITE_LABEL:
        topDomain = WLP_SERVICE_DOMAIN;
        break;
      case ServiceType.SDK:
        topDomain = SDK_SERVICE_DOMAIN;
        break;
      case ServiceType.LIVE_CONNECT:
        throw new NotImplementedError('LiveConnect provisioning not implemented yet');
      default:
        throw new ArgumentError('profile.serviceType');
    }
    return `${companyCode}.${topDomain}`;
  }

  function validateRerun(profile, taskResult) {
    return !taskResult.carrierId;
  }

  function run(data, cb) {
    const { companyCode, serviceType } = data;

    const carrierId = generateCarrierId(companyCode, serviceType);
    const params = {
      identifier: carrierId,
      alias: companyCode,
      // @TODO enable the contact store service temporary
      enable_contact_store: true,
      // @TODO should be set in the template in the future, now it will only white list to its carrier
      partnership_restrictiveness: 'WHITE_LIST',
    };

    logger.debug('CPS create Carrier request sent');
    carrierManagement.createCarrier(params)
      .then(response => {
        logger.debug('CPS create Carrier response received');
        const { id } = response.body;

        if (!id) {
          throw new ReferenceError('id is not defined in response body for carrier creation');
        }

        cb(null, { carrierId: id });
      })
      .catch(cb);
  }

  return createTask('CARRIER_CREATION', run, { validateRerun }, logger);
}

export default createCarrierCreationTask;
