import _ from 'lodash';
import { check } from 'm800-util';

import { decorateController } from './controllersUtil';

export function billingPlanController(billingPlanService) {
  check.ok('billingPlanService', billingPlanService);

  function formatPlan(plan) {
    return {
      ...plan,
      rateTables: plan.rateTables.map(table => ({
        ...table,
        url: `/billing-plans/${plan.id}/rate-tables/${_.kebabCase(table.type)}`,
      })),
    };
  }

  async function getBillingPlans(req, res) {
    const page = await billingPlanService.getBillingPlans(req.query);
    page.items = page.items.map(formatPlan);
    res.json(page);
  }

  async function getBillingPlan(req, res) {
    const plan = await billingPlanService.getBillingPlan(req.params);
    res.json(formatPlan(plan));
  }

  async function createBillingPlan(req, res) {
    const plan = await billingPlanService.createBillingPlan(req.body);
    res.status(201).json(formatPlan(plan));
  }

  async function updateBillingPlan(req, res) {
    const command = {
      ...req.body,
      ...req.params,
    };
    const plan = await billingPlanService.updateBillingPlan(command);
    res.json(formatPlan(plan));
  }

  async function removeBillingPlan(req, res) {
    await billingPlanService.removeBillingPlan(req.params);
    res.sendStatus(204);
  }

  async function downloadRateTableFromPlan(req, res) {
    const type = _.isString(req.params.type) ? req.params.type : '';
    const query = {
      ...req.params,
      type: _.snakeCase(type).toUpperCase(),
    };
    const file = await billingPlanService.downloadRateTableFromPlan(query);
    res.attachment(file.name)
      .type(file.contentType)
      .send(file.content);
  }

  return decorateController({
    getBillingPlans,
    getBillingPlan,
    createBillingPlan,
    updateBillingPlan,
    removeBillingPlan,
    downloadRateTableFromPlan,
  });
}

export default billingPlanController;
