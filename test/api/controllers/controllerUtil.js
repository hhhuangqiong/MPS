import { expect } from 'chai';
import sinon from 'sinon';
import Promise from 'bluebird';

import { decorateControllerMethod, decorateController } from '../../../src/api/controllers/controllersUtil';

describe('api/controllers/controllerUtil', () => {
  const res = {};
  const req = {};

  describe('decorateControllerMethod', () => {
    it('decorates the controller method when method is resolved', async () => {
      const next = sinon.spy();
      const method = sinon.stub().returns(Promise.resolve());
      const decoratedMethod = decorateControllerMethod(method);
      await decoratedMethod(req, res, next);
      expect(method.withArgs(req, res, next).calledOnce).to.be.true;
      expect(next.called).to.be.false;
    });

    it('decorates the method when method is reject', async () => {
      const next = sinon.spy();
      const method = sinon.stub().returns(Promise.reject());
      const decoratedMethod = decorateControllerMethod(method);
      await decoratedMethod(req, res, next);
      expect(method.withArgs(req, res, next).calledOnce).to.be.true;
      expect(next.called).to.be.true;
    });
  });

  describe('decorateController', () => {
    it('decorates all the controller\'s methods', async () => {
      // mock the controller
      const controller = {
        method1: sinon.stub().returns(Promise.reject()),
        method2: sinon.stub().returns(Promise.resolve()),
      };
      const next = sinon.spy();

      // decorate all the methods in controller
      const decoratedController = decorateController(controller);

      // check for method1
      await decoratedController.method1(req, res, next);
      expect(controller.method1.withArgs(req, res, next).calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;

      // check for method2
      await decoratedController.method2(req, res, next);
      expect(controller.method2.withArgs(req, res, next).calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
    });
  });
});
