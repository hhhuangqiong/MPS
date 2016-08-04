// In order to support async/await
import 'babel-polyfill';

import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import morgan from 'morgan';

import apiGateway from '../api';
import errorMiddleware from './errorMiddleware';

const server = express();

server.set('env', process.env.NODE_ENV || 'development');
server.set('port', process.env.PORT || 3333);

server.use(morgan('common'));
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(methodOverride());

apiGateway(server);

server.use(errorMiddleware);

export default server;
