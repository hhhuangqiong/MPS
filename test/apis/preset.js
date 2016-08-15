import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import { name } from 'faker';

xdescribe('Preset', () => {
  before(() => (
    mongoose(process.env.MONGODB_URI).tap(logger)
  ));

  const companyId = name.firstName().toLowerCase();

  const params = {
    capabilities: ['im'],
    payment_mode: 'POST_PAID',
    service_type: 'WLP',
  };

  it('should create provision preset', done => {
    request(server)
      .post(`/preset/${companyId}`)
      .send(params)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        expect(res.body).to.exist;
        expect(res.body.preset_id).to.equal(companyId);
        expect(res.body.capabilities).to.include(params.capabilities[0]);
        expect(res.body.payment_mode).to.equal(params.payment_mode);
        expect(res.body.service_type).to.equal(params.service_type);

        done();
      });
  });

  it('should get provision preset', done => {
    request(server)
      .get(`/preset/${companyId}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        expect(res.body).to.exist;
        expect(res.body.preset_id).to.equal(companyId);
        expect(res.body.capabilities).to.include(params.capabilities[0]);
        expect(res.body.payment_mode).to.equal(params.payment_mode);
        expect(res.body.service_type).to.equal(params.service_type);

        done();
      });
  });

  const updateParams = {
    capabilities: ['sms'],
    payment_mode: 'PRE_PAID',
    service_type: 'SDK',
  };

  it('should update provision preset', done => {
    request(server)
      .put(`/preset/${companyId}`)
      .send(updateParams)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        expect(res.body).to.exist;
        expect(res.body.preset_id).to.equal(companyId);
        expect(res.body.capabilities).to.include(updateParams.capabilities[0]);
        expect(res.body.payment_mode).to.equal(updateParams.payment_mode);
        expect(res.body.service_type).to.equal(updateParams.service_type);

        done();
      });
  });

  it('should get provision preset after update', done => {
    request(server)
      .get(`/preset/${companyId}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        expect(res.body).to.exist;
        expect(res.body.preset_id).to.equal(companyId);
        expect(res.body.capabilities).to.include(updateParams.capabilities[0]);
        expect(res.body.payment_mode).to.equal(updateParams.payment_mode);
        expect(res.body.service_type).to.equal(updateParams.service_type);

        done();
      });
  });
});
