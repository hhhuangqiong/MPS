import Promise from 'bluebird';
import uuid from 'uuid';
import _ from 'lodash';
import { NotImplementedError, ArgumentNullError } from 'common-errors';

import ioc from '../../ioc';
import { createTask } from '../util/task';

import { ServiceTypes, Capabilities } from '../../models/Provisioning';

const { cpsConfig, ApplicationManagement } = ioc.container;

function validateRerun(data, taskResult) {
  if (taskResult.applicationId) {
    // already complete, skip
    return false;
  }

  return true;
}

function reverseDomain(domain) {
  return _.reverse(domain.split('.')).join('.');
}

function generateApplicationId(serviceType, companyCode) {
  switch (serviceType) {
    case ServiceTypes.SDK:
      return `${reverseDomain(cpsConfig.sdkServiceDomain)}.${companyCode}`;
    case ServiceTypes.WHITE_LABEL:
      return `${reverseDomain(cpsConfig.wlServiceDomain)}.${companyCode}`;
    default:
      throw new NotImplementedError(`Service type ${serviceType} provisioning is not supported yet`);
  }
}

function generateApplicationKey() {
  return `mapp${uuid.v1()}`;
}

function generateApplicationSecret() {
  return uuid.v1();
}

const CapabilityPlatforms = [
  Capabilities.PLATFORM_ANDROID,
  Capabilities.PLATFORM_IOS,
  Capabilities.PLATFORM_WEB,
];

function generatePlatformIdentifier(platform) {
  return `com.maaii.${platform}`;
}

function createApplication(platform, { applicationIdentifier, serviceType, featureSetIdentifier, developerId }) {
  const platformIdentifier = generatePlatformIdentifier(platform);

  if (!featureSetIdentifier) {
    return Promise.reject(new ArgumentNullError('featureSetIdentifier'));
  }

  const firstApplicationVersion = {
    version_numbers: {
      version_major: 1,
      version_minor: 0,
      version_patch: 0,
    },
    version_status: 'UN_RELEASED',
  };

  if (serviceType === ServiceTypes.WHITE_LABEL) {
    firstApplicationVersion.feature_set_identifier = featureSetIdentifier;
  }

  const applicationKey = generateApplicationKey();
  const applicationSecret = generateApplicationSecret();

  const params = {
    identifier: applicationIdentifier,
    name: applicationIdentifier,
    application_versions: [firstApplicationVersion],
    platform: platformIdentifier,
    developer: developerId,
    status: 'ACTIVE',
    application_key: applicationKey,
    application_secret: applicationSecret,
  };

  // make request to CPS to create
  return ApplicationManagement.saveApplication(params)
    .then((res) => {
      const applicationId = res.body.id;

      if (!applicationId) {
        throw new ReferenceError(`Unexpected response format from CPS: ${res.body}`);
      }

      return {
        applicationId,
        applicationKey,
        applicationSecret,
      };
    });
}


function run(data, taskResult, cb) {
  const { capabilities, serviceType, companyCode } = data;

  const applications = {};

  let completed;
  try {
    completed = JSON.parse(taskResult.applications);
  } catch (e) {
    completed = {};
  }

  const platforms = _.intersection(CapabilityPlatforms, capabilities);
  let pending = Promise.resolve();

  const applicationIdentifier = generateApplicationId(serviceType, companyCode);
  data.applicationIdentifier = applicationIdentifier;

  // create application for each platform, sequentially
  _.forEach(platforms, platform => {
    // skip completed platforms (during rerun)
    if (completed[platform]) {
      applications[platform] = completed[platform];
      return;
    }

    pending = pending.then(() => createApplication(platform, data))
      .then((result) => {
        // mark successful results
        applications[platform] = result;
      });
  });

  pending.then(() => {
    // all platforms successfully created
    cb(null, { applications: JSON.stringify(applications), applicationIdentifier });
  })
  .catch(err => {
    // return error with succeed created applications
    cb(err, { applications: JSON.stringify(applications) });
  });
}

export default createTask('SAVE_APPLICATION', run, { validateRerun });
