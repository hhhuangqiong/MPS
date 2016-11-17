import { ArgumentNullError, ReferenceError } from 'common-errors';

import { check } from './../../util';
import { compileJsonTemplate } from './common';
import { SMS_REALM_CREATION } from './bpmnEvents';

export function createSmsRealmCreationTask(cpsOptions, smsRealmManagement) {
  check.ok('cpsOptions', cpsOptions);
  check.ok('smsRealmManagement', smsRealmManagement);

  const { sms } = cpsOptions;
  const template = sms.realm.template;

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

    const templateParams = { carrierId };
    const smsRealm = compileJsonTemplate(template, templateParams);
    smsRealm.connection_strategy.system_id = realm.systemId;
    smsRealm.connection_strategy.password = realm.password;
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
