import omitBy from 'lodash/omitBy';
import isUndefined from 'lodash/isUndefined';
import Preset from '../../models/Preset';

import {
  NotFoundError,
} from 'common-errors';

/**
* @api {get} /preset/{preset_id} Get Provision Preset
* @apiName getProvisionPreset
* @apiGroup Provisioning
*
* @apiParams {String} preset_id
*
* @apiSuccess {Array} capabilities of a carrier.
* @apiSuccess {String} service_type of a carrier.
* @apiSuccess {String} payment_mode of a carrier.
*/
export function getProvisionPreset(req, res, next) {
  const { preset_id } = req.params;

  Preset
    .findOne({ preset_id })
    .then(doc => {
      if (!doc) {
        next(new NotFoundError('preset_id'));
        return;
      }

      res.json(doc);
    })
    .catch(error => next(error));
}

/**
* @api {post} /preset/{preset_id} Post Provision Preset
* @apiName createProvisionPreset
* @apiGroup Provisioning
*
* @apiParams {String} preset_id
*
* @apiSuccess {Array} capabilities of a carrier.
* @apiSuccess {String} service_type of a carrier.
* @apiSuccess {String} payment_mode of a carrier.
*/
export function createProvisionPreset(req, res, next) {
  const { preset_id } = req.params;
  const { capabilities, service_type, payment_mode } = req.body;

  const params = omitBy({
    preset_id,
    capabilities,
    service_type,
    payment_mode,
  }, isUndefined);

  const preset = new Preset(params);

  preset
    .save()
    .then(doc => res.json(doc))
    .catch(error => next(error));
}

/**
* @api {put} /preset/{preset_id} Update Provision Preset
* @apiName updateProvisionPreset
* @apiGroup Provisioning
*
* @apiParams {String} preset_id
*
* @apiSuccess {Array} capabilities of a carrier.
* @apiSuccess {String} service_type of a carrier.
* @apiSuccess {String} payment_mode of a carrier.
*/
export function updateProvisionPreset(req, res, next) {
  const { preset_id } = req.params;
  const { capabilities, service_type, payment_mode } = req.body;

  const params = omitBy({
    preset_id,
    capabilities,
    service_type,
    payment_mode,
  }, isUndefined);

  Preset.findOneAndUpdate({ preset_id }, { $set: params }, { new: true })
    .then(doc => res.json(doc))
    .catch(error => next(error));
}
