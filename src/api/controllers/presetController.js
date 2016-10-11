import _ from 'lodash';

import { check } from './../../util';
import { decorateController } from './controllersUtil';

export function presetController(presetService) {
  check.ok('presetService', presetService);

  async function getPreset(req, res) {
    const command = req.params;
    const preset = await presetService.getPreset(command);
    res.json(preset);
  }

  async function setPreset(req, res) {
    const command = _.extend({}, req.params, req.body);
    const preset = await presetService.setPreset(command);
    res.json(preset);
  }

  return decorateController({
    getPreset,
    setPreset,
  });
}

export default presetController;
