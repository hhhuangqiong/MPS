import Promise from 'bluebird';
import _ from 'lodash';
import uuid from 'uuid';
import { ArgumentNullError, ReferenceError } from 'common-errors';

import ioc from '../../ioc';
import { createTask } from '../util/task';
import { Capabilities, ChargeWallets } from '../../models/Provisioning';

const { bossConfig, BossProvisionManagement, CapabilitiesManagement } = ioc.container;
const { BossServiceTypes, BossPaymentModes } = BossProvisionManagement.constructor;
const { CapabilityTypeToIds } = CapabilitiesManagement.constructor;


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
  return CapabilitiesManagement.getProfile(carrierId, CapabilityTypeToIds.Voice)
    .then((res) => {
      const profile = res.body;

      if (!profile.offnet_incoming_call_prefix) {
        throw new ReferenceError('Unexpected response from CPS: `offnet_incoming_call_prefix` missing in voice profile');
      }

      if (!profile.offnet_outgoing_call_prefix) {
        throw new ReferenceError('Unexpected response from CPS: `offnet_outgoing_call_prefix` missing in voice profile');
      }

      return [profile.offnet_incoming_call_prefix, profile.offnet_outgoing_call_prefix];
    });
}

function hasOffnet(data) {
  const { capabilities } = data;
  return _.includes(capabilities, Capabilities.CALL_OFFNET);
}

function hasSms(data) {
  const { capabilities } = data;
  return _.intersection(capabilities, [
    Capabilities.VERIFICATION_SMS,
    Capabilities.IM_TO_SMS,
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
  if (BossPaymentModes[paymentMode] === BossPaymentModes.POST_PAID) {
    initialBalance = _.parseInt(bossConfig.postPaidInitialBalance);
  } else {
    initialBalance = _.parseInt(bossConfig.prePaidInitialBalance);
  }

  if (isChargeSms(data)) {
    const { smsPackageId } = data.billing;
    _.assign(m800Ocs, {
      sms: {
        packageId: smsPackageId,
        type: BossPaymentModes[paymentMode],
        initialBalance,
      },
    });
  }

  if (hasOffnet(data)) {
    const { offnetPackageId } = data.billing;
    _.assign(m800Ocs, {
      offnet: {
        packageId: offnetPackageId,
        type: BossPaymentModes[paymentMode],
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
    serviceType: BossServiceTypes[serviceType],
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
  if (chargeWallet !== ChargeWallets.WALLET_COMPANY) {
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

    return BossProvisionManagement.create(params)
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

export default createTask('BOSS_PROVISION', run, { validateRerun });
