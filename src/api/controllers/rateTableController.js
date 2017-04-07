import _ from 'lodash';
import { check } from 'm800-util';
import { ValidationError } from 'common-errors';

import { decorateController } from './controllersUtil';

export function rateTableController(billingPlanService) {
  check.ok('billingPlanService', billingPlanService);

  async function uploadRateTable(req, res, next) {
    let data = {};
    try {
      data = JSON.parse(req.body.data);
    } catch (e) {
      next(new ValidationError('Invalid request format. Expected JSON data in "data" form field.', e));
    }
    const command = {
      file: {
        name: _.get(req, 'file.originalname'),
        content: _.get(req, 'file.buffer'),
      },
      data,
    };
    const result = await billingPlanService.uploadRateTable(command);
    res.status(201).json(result);
  }

  async function downloadRateTable(req, res) {
    const file = await billingPlanService.downloadRateTable(req.params);
    res.attachment(file.name)
      .type(file.contentType)
      .send(file.content);
  }

  async function removeRateTable(req, res) {
    await billingPlanService.removeRateTable(req.params);
    res.sendStatus(204);
  }

  return decorateController({
    uploadRateTable,
    downloadRateTable,
    removeRateTable,
  });
}

export default rateTableController;
