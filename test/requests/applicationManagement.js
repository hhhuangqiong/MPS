import { describe, it } from 'mocha';
import { expect } from 'chai';

import {
  expectNotExist,
  missingRequiredField,
  httpStatusError,
} from '../expectValidator';

import ioc from '../../src/ioc';

const {
  saveApplicationRequest,
} = ioc.container.applicationManagementFactory;

const DEFAULT_IDENTIFIER = 'example.com';

const DEFAULT_PLATFORM = 'com.maaii.platform.ios';

const DEFAULT_APPLICATION_VERSIONS = [{
  version_numbers: {
    version_major: 1,
    version_minor: 0,
    version_patch: 0,
  },
  version_status: 'UN_RELEASED',
  feature_set_identifier: 'com.maaii.featureset.sparkle_1_0_0',
}];

const DEFAULT_DEVELOPER_KEY = '5530ea24693ddd59606d0f6d';

describe('Application Management', () => {
  describe('Field validation', () => {
    it('should not pass validation for missing arg "identifier"', () => (
      saveApplicationRequest()
        .then(expectNotExist)
        .catch(missingRequiredField('identifier'))
    ));

    it('should not pass validation for missing arg "application_versions"', () => (
      saveApplicationRequest({ identifier: DEFAULT_IDENTIFIER })
        .then(expectNotExist)
        .catch(missingRequiredField('application_versions'))
    ));

    it('should not pass validation for missing arg "application_versions"', () => (
      saveApplicationRequest({
        identifier: DEFAULT_IDENTIFIER,
        application_versions: [],
      })
        .then(expectNotExist)
        .catch(error => {
          expect(error).to.exist;
          expect(error.field).to.equal('application_versions');
          expect(error.code).to.equal('array.includesRequiredUnknowns');
        })
    ));

    it('should not pass validation for missing arg "version_status"', () => (
      saveApplicationRequest({
        identifier: DEFAULT_IDENTIFIER,
        application_versions: [{
          version_numbers: {
            version_major: 1,
            version_minor: 0,
            version_patch: 0,
          },
        }],
      })
        .then(expectNotExist)
        .catch(missingRequiredField('application_versions.0.version_status'))
    ));

    it('should not pass validation for missing arg "feature_set_identifier"', () => (
      saveApplicationRequest({
        identifier: DEFAULT_IDENTIFIER,
        application_versions: [{
          version_numbers: {
            version_major: 1,
            version_minor: 0,
            version_patch: 0,
          },
          version_status: 'UN_RELEASED',
        }],
      })
        .then(expectNotExist)
        .catch(missingRequiredField('application_versions.0.feature_set_identifier'))
    ));

    it('should not pass validation for missing arg "developer"', () => (
      saveApplicationRequest({
        identifier: DEFAULT_IDENTIFIER,
        application_versions: DEFAULT_APPLICATION_VERSIONS,
        platform: DEFAULT_PLATFORM,
      })
        .then(expectNotExist)
        .catch(missingRequiredField('developer'))
    ));

    it('should not pass validation for missing arg "status"', () => (
      saveApplicationRequest({
        identifier: DEFAULT_IDENTIFIER,
        application_versions: DEFAULT_APPLICATION_VERSIONS,
        platform: DEFAULT_PLATFORM,
        developer: DEFAULT_DEVELOPER_KEY,
      })
        .then(expectNotExist)
        .catch(missingRequiredField('status'))
    ));

    it('should not pass validation for missing arg "bundle_id"', () => (
      saveApplicationRequest({
        identifier: DEFAULT_IDENTIFIER,
        application_versions: DEFAULT_APPLICATION_VERSIONS,
        platform: DEFAULT_PLATFORM,
        developer: DEFAULT_DEVELOPER_KEY,
        status: 'ACTIVE',
      })
        .then(expectNotExist)
        .catch(missingRequiredField('bundle_id'))
    ));
  });

  it('should throw Application already exists', () => (
    saveApplicationRequest({
      identifier: DEFAULT_IDENTIFIER,
      application_versions: DEFAULT_APPLICATION_VERSIONS,
      platform: DEFAULT_PLATFORM,
      developer: DEFAULT_DEVELOPER_KEY,
      status: 'ACTIVE',
      bundle_id: 'bundleId',
    })
      .then(expectNotExist)
      .catch(httpStatusError(400, 'Application already exists.', 50401))
  ));
});
