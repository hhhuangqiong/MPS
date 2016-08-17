import ioc from '../../ioc';
import _ from 'lodash';

const presetService = ioc.container.presetService;

export async function getPreset(req, res, next) {
  const command = req.params;

  try {
    const preset = await presetService.getPreset(command);
    res.json(preset);
  } catch (e) {
    next(e);
  }
}

export async function setPreset(req, res, next) {
  const command = _.extend({}, req.params, req.body);

  try {
    const preset = await presetService.setPreset(command);
    res.json(preset);
  } catch (e) {
    next(e);
  }
}
