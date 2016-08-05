import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import { name } from 'faker';
import uuid from 'uuid';

import logger from '../../src/initializer/logger';
import connectMongoose from '../../src/initializer/connectMongoose';
import server from '../../src/server/server';

describe('Provisioning APIs', () => {
  before(() => (
    connectMongoose(process.env.MONGODB_URI).tap(logger)
  ));

  const params = {
    company_id: uuid.v1(),
    company_code: name.firstName().toLowerCase(),
    company_name: name.lastName(),
    country: 'hk',
  };

  it('should start provisioning', done => {
    request(server)
      .post('/provisioning')
      .send(params)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        expect(res.body).to.exist;
        expect(res.body.provision_id).to.exist;
        expect(res.body.company_id).to.equal(params.company_id);
        expect(res.body.company_code).to.equal(params.company_code);
        expect(res.body.carrier_id).to.equal(`${params.company_code}.maaii.com`);

        done();
      });
  });

  it('should get provisioning status by query', done => {
    request(server)
      .get(`/provisioning?company_id=${params.company_id}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        expect(res.body).to.exist;
        expect(res.body.status).to.not.equal('ERROR');
        expect(res.body.data).to.exist;
        expect(res.body.data.company_id).to.equal(params.company_id);
        expect(res.body.data.company_code).to.equal(params.company_code);

        done();
      });
  });

  it('should get provisioning status by multiple companies', done => {
    request(server)
      .get(`/provisioning/companies?company_id=${params.company_id}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        expect(res.body).to.exist;
        expect(res.body).to.have.length(1);
        expect(res.body[0].status).to.not.equal('ERROR');
        expect(res.body[0].data).to.exist;
        expect(res.body[0].data.company_id).to.equal(params.company_id);
        expect(res.body[0].data.company_code).to.equal(params.company_code);

        done();
      });
  });
});
