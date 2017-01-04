import _ from 'lodash';
import { NotImplementedError, ReferenceError, ValidationError } from 'common-errors';
import { check } from 'm800-util';

import { CARRIER_CREATION } from './bpmnEvents';

import {
  ServiceType,
} from './../../domain';

export function createCarrierCreationTask(templateService, carrierManagement) {
  check.ok('templateService', templateService);
  check.ok('carrierManagement', carrierManagement);

  const DOMAINS = {
    [ServiceType.SDK]: cps => cps.sdkServiceDomain,
    [ServiceType.WHITE_LABEL]: cps => cps.wlServiceDomain,
  };

  async function createCarrier(state, profile, context) {
    if (state.results.carrierId) {
      return null;
    }
    const { logger } = context;
    const { serviceType } = profile;
    if (serviceType === ServiceType.LIVE_CONNECT) {
      throw new NotImplementedError('LiveConnect provisioning not implemented yet');
    }
    const cpsOptions = await templateService.get('cps');
    const domain = DOMAINS[serviceType](cpsOptions);
    const params = await templateService.render('cps.carrier', {
      companyCode: profile.companyCode,
      domain,
    });

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
          carrierId: id,
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
