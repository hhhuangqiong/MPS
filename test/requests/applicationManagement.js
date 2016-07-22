import { describe, it } from 'mocha';
import { expect } from 'chai';
import container from '../../src/ioc';

const {
  saveApplicationRequest,
} = container.applicationManagementFactory;

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
      .catch(error => expect(error.message).to.equal('"identifier" is required'))
    ));

    it('should not pass validation for missing arg "application_versions"', () => (
      saveApplicationRequest({
        identifier: DEFAULT_IDENTIFIER,
      })
        .catch(error => expect(error.message).to.equal('"application_versions" is required'))
    ));

    it('should not pass validation for missing arg "version_numbers"', () => (
      saveApplicationRequest({
        identifier: DEFAULT_IDENTIFIER,
        application_versions: [],
      })
        .catch(error => expect(error.message).to.equal('"application_versions" does not contain 1 required value(s)'))
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
        .catch(error => expect(error.message).to.equal('"version_status" is required'))
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
        .catch(error => expect(error.message).to.equal('"feature_set_identifier" is required'))
    ));

    it('should not pass validation for missing arg "developer"', () => (
      saveApplicationRequest({
        identifier: DEFAULT_IDENTIFIER,
        application_versions: DEFAULT_APPLICATION_VERSIONS,
        platform: DEFAULT_PLATFORM,
      })
        .catch(error => expect(error.message).to.equal('"developer" is required'))
    ));

    it('should not pass validation for missing arg "status"', () => (
      saveApplicationRequest({
        identifier: DEFAULT_IDENTIFIER,
        application_versions: DEFAULT_APPLICATION_VERSIONS,
        platform: DEFAULT_PLATFORM,
        developer: DEFAULT_DEVELOPER_KEY,
      })
        .catch(error => expect(error.message).to.equal('"status" is required'))
    ));

    it('should not pass validation for missing arg "bundle_id"', () => (
      saveApplicationRequest({
        identifier: DEFAULT_IDENTIFIER,
        application_versions: DEFAULT_APPLICATION_VERSIONS,
        platform: DEFAULT_PLATFORM,
        developer: DEFAULT_DEVELOPER_KEY,
        status: 'ACTIVE',
      })
        .catch(error => expect(error.message).to.equal('"bundle_id" is required'))
    ));
  });

  it('405 Not Implement', () => (
    saveApplicationRequest({
      identifier: DEFAULT_IDENTIFIER,
      application_versions: DEFAULT_APPLICATION_VERSIONS,
      platform: DEFAULT_PLATFORM,
      developer: DEFAULT_DEVELOPER_KEY,
      status: 'ACTIVE',
      bundle_id: 'bundleId',
    })
      .catch(error => {
        expect(error.message).to.equal('Application already exists.');
      })
  ));
});
