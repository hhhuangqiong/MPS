import Promise from 'bluebird';
import _ from 'lodash';
import uuid from 'uuid';
import { ArgumentNullError, ReferenceError } from 'common-errors';

import {
  BossServiceType,
  BossPaymentMode,
  Capability,
  ChargeWallet,
  CpsCapabilityType,
} from './../../domain';
import { check, createTask } from './util';

export function createBossProvisionTask(logger, bossOptions, bossProvisionManagement, capabilitiesManagement) {
  check.ok('logger', logger);
  check.ok('bossOptions', bossOptions);
  check.ok('bossProvisionManagement', bossProvisionManagement);
  check.ok('capabilitiesManagement', capabilitiesManagement);

  function validateRerun(profile, taskResult) {
    if (taskResult.bossProvisionId) {
      // skip on rerun
      return false;
    }

    return true;
  }

  function normalizePrefixes(prefixes) {
    if (!prefixes) {
      return [];
    }
    return _.map(prefixes, (prefix) => _.trimStart(prefix, '+'));
  }

  function getOffnetPrefix(carrierId) {
    return capabilitiesManagement.getProfile(carrierId, CpsCapabilityType.Voice)
      .then((res) => {
        const profile = res.body;

        if (!profile.offnet_incoming_call_prefix) {
          throw new ReferenceError(
            'Unexpected response from CPS: `offnet_incoming_call_prefix` missing in voice profile'
          );
        }

        if (!profile.offnet_outgoing_call_prefix) {
          throw new ReferenceError(
            'Unexpected response from CPS: `offnet_outgoing_call_prefix` missing in voice profile'
          );
        }

        return [profile.offnet_incoming_call_prefix, profile.offnet_outgoing_call_prefix];
      });
  }

  function hasOffnet(data) {
    const { capabilities } = data;
    return _.includes(capabilities, Capability.CALL_OFFNET);
  }

  function hasSms(data) {
    const { capabilities } = data;
    return _.intersection(capabilities, [
      Capability.VERIFICATION_SMS,
      Capability.IM_TO_SMS,
    ]).length > 0;
  }

  function isChargeSms(data) {
    return hasSms(data) && _.get(data, 'smsc.needBilling', false);
  }

  function generateRequestId() {
    return uuid.v1();
  }

  function generateM800Ocs(data) {
    const { paymentMode } = data;
    const m800Ocs = {};

    let initialBalance;
    if (BossPaymentMode[paymentMode] === BossPaymentMode.POST_PAID) {
      initialBalance = _.parseInt(bossOptions.postPaidInitialBalance);
    } else {
      initialBalance = _.parseInt(bossOptions.prePaidInitialBalance);
    }

    if (isChargeSms(data)) {
      const { smsPackageId } = data.billing;
      _.assign(m800Ocs, {
        sms: {
          packageId: smsPackageId,
          type: BossPaymentMode[paymentMode],
          initialBalance,
        },
      });
    }

    if (hasOffnet(data)) {
      const { offnetPackageId } = data.billing;
      _.assign(m800Ocs, {
        offnet: {
          packageId: offnetPackageId,
          type: BossPaymentMode[paymentMode],
          initialBalance,
        },
      });
    }

    return m800Ocs;
  }

  function generateBossProvisionCarrier(data) {
    const { carrierId, serviceType, offnetPrefixes, offnetPrefixTest, smsPrefix, billing } = data;

    return {
      carrierId,
      serviceType: BossServiceType[serviceType],
      offNetPrefix: normalizePrefixes(offnetPrefixes),
      offNetPrefixTest: normalizePrefixes(offnetPrefixTest),
      smsPrefix: normalizePrefixes(smsPrefix),
      remarks: `Remarks for ${carrierId}`,
      currency: billing.currency,
      m800Ocs: generateM800Ocs(data),
    };
  }

  function generateBossProvisionParams(data) {
    const { resellerCarrierId, companyCode, companyInfo, country } = data;

    return {
      id: generateRequestId(),
      accountCode: companyCode,
      accountName: companyInfo.name,
      country,
      carrierIdOfReseller: resellerCarrierId,
      carriers: [
        generateBossProvisionCarrier(data),
      ],
    };
  }

  function run(data, cb) {
    // temporary turn off checking of sms prefix as sms prefix generation is not
    // ready: WLP-1142
    // const { carrierId, smsPrefix, chargeWallet } = data;
    const { carrierId, chargeWallet } = data;
    const smsPackageId = _.get(data, 'billing.smsPackageId', null);
    const offnetPackageId = _.get(data, 'billing.offnetPackageId', null);

    // skip if not using m800 ocs(company) wallet
    if (chargeWallet !== ChargeWallet.WALLET_COMPANY) {
      cb(null, {});
      return;
    }

    if (!carrierId) {
      cb(new ArgumentNullError('carrierId'));
      return;
    }

    if (isChargeSms(data)) {
      // temporary turn off checking of sms prefix as sms prefix generation is not
      // ready: WLP-1142
      // if (!smsPrefix) {
      //   cb(new ArgumentNullError('smsPrefix'));
      //   return;
      // }
      if (!smsPackageId) {
        cb(new ArgumentNullError('smsPackageId'));
        return;
      }
    }

    if (hasOffnet(data) && !offnetPackageId) {
      throw new ArgumentNullError('offnetPackageId');
    }

    let prepareData;
    if (hasOffnet(data)) {
      prepareData = getOffnetPrefix(carrierId).then((offnetPrefixes) => (
        _.extend({}, data, { offnetPrefixes })
      ));
    } else {
      prepareData = Promise.resolve(data);
    }

    prepareData.then((preparedData) => {
      const { offnetPrefixes } = preparedData;
      if (hasOffnet(data) && !offnetPrefixes.length) {
        throw new ArgumentNullError('offnetPrefixes');
      }

      const params = generateBossProvisionParams(preparedData);

      return bossProvisionManagement.create(params)
        .then(response => {
          const { id: bossProvisionId, success } = response.body;
          if (!success) {
            throw new ReferenceError('Unexpected response from BOSS: success not true with 2xx');
          }

          if (!bossProvisionId) {
            throw new ReferenceError('Unexpected response from BOSS: id is missing');
          }
          cb(null, { bossProvisionId });
        });
    }).catch(cb);
  }

  return createTask('BOSS_PROVISION', run, { validateRerun }, logger);
}

export default createBossProvisionTask;
