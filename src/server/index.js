import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import morgan from 'morgan';
import heathCheck from 'm800-health-check';

import apiGateway from '../api';
import connectMongoose from '../initializer/connectMongoose';
import logger from '../initializer/logger';
import listener from './listener';

const server = express();

server.set('env', process.env.NODE_ENV || 'development');
server.set('port', process.env.PORT || 3333);

server.use(morgan('common'));
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(methodOverride());

apiGateway(server);

heathCheck(server, {
  mongodb: {
    mongoose,
  },
});

connectMongoose(process.env.MONGODB_URI)
  .tap(logger)
  .then(() => {
    listener(server).tap(logger);
  });
