import {
  PARALLEL_ALL_START,
  JOIN_CAPABILITY_AND_FEATURE_SET,
  PARALLEL_ALL_END,
} from './bpmnEvents';

export function parallelAllStartGateway() {
  return null;
}

parallelAllStartGateway.$meta = {
  name: PARALLEL_ALL_START,
};

export function joinCapabilityAndFeatureSetGateway() {
  return null;
}

joinCapabilityAndFeatureSetGateway.$meta = {
  name: JOIN_CAPABILITY_AND_FEATURE_SET,
};

export function parallelAllEndGateway() {
  return null;
}

parallelAllEndGateway.$meta = {
  name: PARALLEL_ALL_END,
};
