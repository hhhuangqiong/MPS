import 'babel-polyfill';
import 'source-map-support/register';

import { create } from './app';
import config from './config';

const app = create(config);
const server = app.server;
const bpmn = app.ProvisioningProcessManager;

bpmn.start();
server.start();
