import _ from 'lodash';
import { ArgumentError, NotImplementedError, ReferenceError, ValidationError } from 'common-errors';

import { CARRIER_CREATION } from './bpmnEvents';
import { check } from './../../util';
import {
  ServiceType,
} from './../../domain';

export function createCarrierCreationTask(cpsOptions, carrierManagement) {
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

  async function createCarrier(state, profile, context) {
    if (state.results.carrierId) {
      return null;
    }
    const { logger } = context;
    const { companyCode, serviceType } = profile;
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
    try {
      const response = await carrierManagement.createCarrier(params);
      logger.debug('CPS create Carrier response received');
      const { id } = response.body;
      if (!id) {
        throw new ReferenceError('id is not defined in response body for carrier creation');
      }
      return {
        results: {
          carrierId,
        },
      };
    } catch (e) {
      if (e instanceof ValidationError && e.code === carrierManagement.errorNames.CARRIER_ALREADY_EXISTS) {
        const userError = {
          ..._.pick(e, ['message', 'name', 'code']),
          ...context.trace,
          // Not unique company code which MPS is unaware about leads to duplicate carrier id in CPS
          path: 'profile.companyCode',
        };
        return { errors: [userError] };
      }
      throw e;
    }
  }

  createCarrier.$meta = {
    name: CARRIER_CREATION,
  };

  return createCarrier;
}

export default createCarrierCreationTask;
