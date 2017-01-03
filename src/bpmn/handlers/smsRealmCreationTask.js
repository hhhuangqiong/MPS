import { ArgumentNullError, ReferenceError } from 'common-errors';
import { check } from 'm800-util';

import { SMS_REALM_CREATION } from './bpmnEvents';

export function createSmsRealmCreationTask(templateService, smsRealmManagement) {
  check.ok('templateService', templateService);
  check.ok('smsRealmManagement', smsRealmManagement);

  async function createSmsRealm(state, profile) {
    if (state.results.smsRealmId) {
      return null;
    }

    const { carrierId } = state.results;
    if (!carrierId) {
      throw new ArgumentNullError('carrierId');
    }

    const { smsc: { realm } } = profile;

    // if realm is empty, no need to create sms realm
    if (!realm) {
      return null;
    }

    const templateParams = { carrierId, ...realm };
    const smsRealm = await templateService.render('cps.smsRealm', templateParams);
    smsRealm.connection_strategy.binding_details = realm.bindingDetails;

    const response = await smsRealmManagement.create(smsRealm);
    const { id: smsRealmId } = response.body;
    if (!smsRealmId) {
      throw new ReferenceError('id not defined in response from sms realm creation');
    }
    return {
      results: {
        smsRealmId,
      },
    };
  }

  createSmsRealm.$meta = {
    name: SMS_REALM_CREATION,
  };

  return createSmsRealm;
}

export default createSmsRealmCreationTask;
