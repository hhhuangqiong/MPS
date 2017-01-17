import _ from 'lodash';
import { check } from 'm800-util';
import { decorateController } from './controllersUtil';

export function provisioningController(provisioningService) {
  check.ok('provisioningService', provisioningService);

  async function createProvisioning(req, res) {
    const provisionProfile = JSON.parse(req.body.data);
    provisionProfile.logo = req.file;
    const result = await provisioningService.createProvisioning(provisionProfile);
    res.json(result);
  }

  async function getProvisioning(req, res) {
    const query = req.query;
    const params = req.params;
    const command = _.extend({}, params, query);
    const provisionings = await provisioningService.getProvisionings(command);
    res.json(provisionings);
  }

  async function updateProvisioning(req, res) {
    const command = _.extend({}, req.params, { profile: req.body });
    const provisioning = await provisioningService.updateProvisioning(command);
    res.json(provisioning);
  }

  return decorateController({
    createProvisioning,
    updateProvisioning,
    getProvisioning,
  });
}

export default provisioningController;
