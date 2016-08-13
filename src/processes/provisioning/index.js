import path from 'path';
import { addProcess } from '../util/process';

export default function provisioningProcessor(processManager) {
  const processHandlers = require('./handlers');

  return addProcess({
    processManager,
    processPath: path.resolve(__dirname, './index.bpmn'),
    processHandlers,
    startEventName: 'PROVISIONING_START',
    endEventName: 'PROVISIONING_END',
  });
}
