import { expect } from 'chai';
import {
  PARALLEL_ALL_START,
  JOIN_CAPABILITY_AND_FEATURE_SET,
  PARALLEL_ALL_END,
} from '../../../src/bpmn/handlers/bpmnEvents';
import {
  parallelAllStartGateway,
  joinCapabilityAndFeatureSetGateway,
  parallelAllEndGateway,
} from '../../../src/bpmn/handlers/gateways';

describe('bpmn/handlers/gateways', () => {
  describe('bpmn/handlers/parallelAllStartGateway', () => {
    it('returns null', () => {
      expect(parallelAllStartGateway()).to.be.null;
    });
    it('will have name which is PARALLEL_ALL_START', () => {
      expect(parallelAllStartGateway.$meta.name).to.equal(PARALLEL_ALL_START);
    });
  });
  describe('bpmn/handlers/joinCapabilityAndFeatureSetGateway', () => {
    it('returns null', () => {
      expect(joinCapabilityAndFeatureSetGateway()).to.be.null;
    });
    it('will have name which is JOIN_CAPABILITY_AND_FEATURE_SET', () => {
      expect(joinCapabilityAndFeatureSetGateway.$meta.name).to.equal(JOIN_CAPABILITY_AND_FEATURE_SET);
    });
  });
  describe('bpmn/handlers/parallelAllEndGateway', () => {
    it('returns null', () => {
      expect(parallelAllEndGateway()).to.be.null;
    });
    it('will have name which is PARALLEL_ALL_END', () => {
      expect(parallelAllEndGateway.$meta.name).to.equal(PARALLEL_ALL_END);
    });
  });
});
