import _ from 'lodash';
import uuid from 'uuid';
import { ArgumentNullError, ReferenceError } from 'common-errors';

import {
  BossServiceType,
  BossPaymentMode,
  Capability,
  ChargeWallet,
  CpsCapabilityType,
  translateTo10DigitOffnetPrefix,
} from './../../domain';
import { BOSS_PROVISION } from './bpmnEvents';
import { check } from './../../util';

export function createBossProvisionTask(bossOptions, bossProvisionManagement, capabilitiesManagement) {
  check.ok('bossOptions', bossOptions);
  check.ok('bossProvisionManagement', bossProvisionManagement);
  check.ok('capabilitiesManagement', capabilitiesManagement);

  function normalizePrefixes(prefixes) {
    if (!prefixes) {
      return [];
    }
    return _.map(prefixes, (prefix) => _.trimStart(prefix, '+'));
  }

  async function getOffnetPrefix(carrierId) {
    const res = await capabilitiesManagement.getProfile(carrierId, CpsCapabilityType.Voice);
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
  }

  function hasOffnet(profile) {
    const { capabilities } = profile;
    return _.includes(capabilities, Capability.CALL_OFFNET);
  }

  function hasSms(profile) {
    const { capabilities } = profile;
    return _.intersection(capabilities, [
      Capability.VERIFICATION_SMS,
      Capability.IM_TO_SMS,
    ]).length > 0;
  }

  function isChargeSms(profile) {
    return hasSms(profile) && _.get(profile, 'smsc.needBilling', false);
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

  function generateBossProvisionCarrier(options) {
    const { carrierId, serviceType, offnetPrefixes, offnetPrefixTest, smsPrefix, billing } = options;

    return {
      carrierId,
      serviceType: BossServiceType[serviceType],
      offNetPrefix: normalizePrefixes(offnetPrefixes),
      offNetPrefixTest: normalizePrefixes(offnetPrefixTest),
      smsPrefix: normalizePrefixes(smsPrefix),
      remarks: `Remarks for ${carrierId}`,
      currency: billing.currency,
      m800Ocs: generateM800Ocs(options),
    };
  }

  function generateBossProvisionParams(options) {
    const { resellerCarrierId, companyCode, companyInfo, country } = options;

    return {
      id: generateRequestId(),
      accountCode: companyCode,
      accountName: companyInfo.name,
      country,
      carrierIdOfReseller: resellerCarrierId,
      carriers: [
        generateBossProvisionCarrier(options),
      ],
    };
  }

  async function provisionBoss(state, profile) {
    if (state.results.bossProvisionId) {
      return null;
    }
    const { carrierId, smsPrefix } = state.results;
    const { chargeWallet } = profile;
    const smsPackageId = _.get(profile, 'billing.smsPackageId', null);
    const offnetPackageId = _.get(profile, 'billing.offnetPackageId', null);

    // skip if not using m800 ocs(company) wallet
    if (chargeWallet !== ChargeWallet.WALLET_COMPANY) {
      return null;
    }

    if (!carrierId) {
      throw new ArgumentNullError('carrierId');
    }

    if (isChargeSms(profile)) {
      // temporary turn off checking of sms prefix as sms prefix generation is not
      // ready: WLP-1142
      // if (!smsPrefix) {
      //   cb(new ArgumentNullError('smsPrefix'));
      //   return;
      // }
      if (!smsPackageId) {
        throw new ArgumentNullError('smsPackageId');
      }
    }

    if (hasOffnet(profile) && !offnetPackageId) {
      throw new ArgumentNullError('offnetPackageId');
    }

    let offnetPrefixes;
    if (hasOffnet(profile)) {
      offnetPrefixes = _.map(await getOffnetPrefix(carrierId), translateTo10DigitOffnetPrefix);
      if (!offnetPrefixes.length) {
        throw new ArgumentNullError('offnetPrefixes');
      }
    }

    const provisionRequirements = {
      resellerCarrierId: profile.resellerCarrierId,
      companyCode: profile.companyCode,
      companyInfo: profile.companyInfo,
      country: profile.country,
      carrierId,
      serviceType: profile.serviceType,
      billing: profile.billing,
      offnetPrefixes,
      offnetPrefixTest: null,
      smsPrefix,
      paymentMode: profile.paymentMode,
      capabilities: profile.capabilities,
      smsc: profile.smsc,
    };

    const bossParams = generateBossProvisionParams(provisionRequirements);
    const response = await bossProvisionManagement.create(bossParams);
    const { id: bossProvisionId, success } = response.body;
    if (!success) {
      throw new ReferenceError('Unexpected response from BOSS: success not true with 2xx');
    }
    if (!bossProvisionId) {
      throw new ReferenceError('Unexpected response from BOSS: id is missing');
    }

    return {
      results: {
        bossProvisionId,
      },
    };
  }

  provisionBoss.$meta = {
    name: BOSS_PROVISION,
  };

  return provisionBoss;
}

export default createBossProvisionTask;
