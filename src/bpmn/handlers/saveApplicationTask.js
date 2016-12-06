import uuid from 'uuid';
import _ from 'lodash';
import { NotImplementedError, ArgumentNullError } from 'common-errors';

import {
  ServiceType,
  Capability,
} from './../../domain';
import { IncompleteResultError } from './common';
import { check } from './../../util';
import { SAVE_APPLICATION } from './bpmnEvents';

export function createSaveApplicationTask(templateService, applicationManagement) {
  check.ok('templateService', templateService);
  check.ok('applicationManagement', applicationManagement);

  function reverseDomain(domain) {
    return _.reverse(domain.split('.')).join('.');
  }

  function generateApplicationId(serviceType, companyCode, cpsOptions) {
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

  const PlatformCapabilities = [
    Capability.PLATFORM_ANDROID,
    Capability.PLATFORM_IOS,
    Capability.PLATFORM_WEB,
  ];

  function generatePlatformIdentifier(platform) {
    return `com.maaii.${platform}`;
  }

  async function createApplication(
    platform,
    { applicationIdentifier, serviceType, featureSetIdentifier, developerId, applicationVersion }
    ) {
    const platformIdentifier = generatePlatformIdentifier(platform);

    if (!featureSetIdentifier) {
      throw new ArgumentNullError('featureSetIdentifier');
    }

    if (!applicationVersion) {
      throw new ArgumentNullError('Application version');
    }

    if (serviceType === ServiceType.WHITE_LABEL) {
      applicationVersion.feature_set_identifier = featureSetIdentifier;
    }

    const applicationKey = generateApplicationKey();
    const applicationSecret = generateApplicationSecret();

    const params = {
      identifier: applicationIdentifier,
      name: applicationIdentifier,
      application_versions: [applicationVersion],
      platform: platformIdentifier,
      developer: developerId,
      status: 'ACTIVE',
      application_key: applicationKey,
      application_secret: applicationSecret,
    };

    // make request to CPS to create
    const res = await applicationManagement.saveApplication(params);
    const applicationId = res.body.id;
    if (!applicationId) {
      throw new ReferenceError(`Unexpected response format from CPS: ${res.body}`);
    }

    return {
      applicationId,
      applicationKey,
      applicationSecret,
    };
  }

  async function saveApplication(state, profile) {
    if (state.results.applicationId) {
      return null;
    }
    const { applications, featureSetIdentifier, developerId } = state.results;
    const { capabilities, serviceType, companyCode } = profile;

    let currentApplications = applications;
    const platforms = _(PlatformCapabilities)
      .intersection(capabilities)
      .difference(_.keys(currentApplications))
      .value();

    const cpsOptions = await templateService.get('cps');
    const applicationIdentifier = generateApplicationId(serviceType, companyCode, cpsOptions);
    const applicationVersion = cpsOptions.applicationVersion;

    let error = null;
    try {
      for (const platform of platforms) {
        const params = {
          applicationIdentifier,
          serviceType,
          featureSetIdentifier,
          developerId,
          applicationVersion,
        };
        const result = await createApplication(platform, params);
        currentApplications = [...currentApplications, {
          platform,
          app: result,
        }];
      }
    } catch (e) {
      error = e;
    }

    const updates = {
      results: {
        applicationIdentifier,
        applications: currentApplications,
      },
    };
    if (error) {
      throw new IncompleteResultError(updates, error);
    }
    return updates;
  }

  saveApplication.$meta = {
    name: SAVE_APPLICATION,
  };

  return saveApplication;
}

export default createSaveApplicationTask;
