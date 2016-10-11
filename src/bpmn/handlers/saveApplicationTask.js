import Promise from 'bluebird';
import uuid from 'uuid';
import _ from 'lodash';
import { NotImplementedError, ArgumentNullError } from 'common-errors';

import {
  ServiceType,
  Capability,
} from './../../domain';
import { check, createTask } from './util';

export function createSaveApplicationTask(logger, cpsOptions, applicationManagement) {
  check.ok('logger', logger);
  check.ok('cpsOptions', cpsOptions);
  check.ok('applicationManagement', applicationManagement);

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
      case ServiceType.SDK:
        return `${reverseDomain(cpsOptions.sdkServiceDomain)}.${companyCode}`;
      case ServiceType.WHITE_LABEL:
        return `${reverseDomain(cpsOptions.wlServiceDomain)}.${companyCode}`;
      default:
        throw new NotImplementedError(`Service type ${serviceType} provisioning is not supported yet`);
    }
  }

  function generateApplicationKey() {
    return `mapp${uuid.v1()}`;
  }

// TODO: looks like a not secure way to generate application secret
  function generateApplicationSecret() {
    return uuid.v1();
  }

  const CapabilityPlatforms = [
    Capability.PLATFORM_ANDROID,
    Capability.PLATFORM_IOS,
    Capability.PLATFORM_WEB,
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

    if (serviceType === ServiceType.WHITE_LABEL) {
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
    return applicationManagement.saveApplication(params)
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

  return createTask('SAVE_APPLICATION', run, { validateRerun }, logger);
}

export default createSaveApplicationTask;
