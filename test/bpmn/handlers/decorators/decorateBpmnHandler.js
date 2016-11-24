import { expect } from 'chai';
import sinon from 'sinon';
import { ArgumentError } from 'common-errors';
import { Logger } from 'winston';

import { decorateBpmnHandler } from '../../../../src/bpmn/handlers/decorators/decorateBpmnHandler';

describe('bpmn/handlers/decorators/decorateBpmnHandler', () => {
  const sampleHandler = () => {};
  sampleHandler.$meta = {
    name: 'sampleHandler',
  };
  const sampleLogger = new Logger();

  it('throws ArgumentError when handler is not valid', () => {
    expect(() => decorateBpmnHandler('', sampleLogger)).to.throw(ArgumentError);
  });

  it('throws ArgumentError when handler is not passed', () => {
    expect(() => decorateBpmnHandler(null, sampleLogger)).to.throw(ArgumentError);
  });

  it('throws ArgumentError when logger is missing', () => {
    expect(() => decorateBpmnHandler(null, sampleHandler)).to.throw(ArgumentError);
  });

  it('throws ArgumentError when handler meta is not valid', () => {
    const invalidHandler = () => {};
    invalidHandler.$meta = 'sample';
    expect(() => decorateBpmnHandler(invalidHandler, sampleLogger)).to.throw(ArgumentError);
  });

  // process which mocked the parent when decorate the helper
  const sampleProcess = {
    getProcessId: () => {},
    getProperty: () => ({
      system: {
        errors: [],
      },
    }),
    setProperty: () => {},
  };

  it('decorates the handler and handler is called once with correct arugments and logger', async () => {
    const sampleHandlerSpy = sinon.spy(sampleHandler);
    const decoratedHandler = decorateBpmnHandler(sampleHandlerSpy, sampleLogger);
    expect(decoratedHandler.$meta).to.equal(sampleHandler.$meta);

    // expect it will run in the processManager that with processId
    await decoratedHandler.call(sampleProcess, 1, () => {});
    expect(sampleHandlerSpy.calledOnce).to.be.true;

    // check the first argument will be called second arguement which is wrapped context object
    const spyArgument = sampleHandlerSpy.args[0];
    expect(spyArgument).to.have.lengthOf(2);
    expect(spyArgument[0]).to.equal(1);
    expect(spyArgument[1]).to.be.an('object');

    // check the second argument which will be the current process context
    // check the wrapped logger with rewriters and filters
    const logger = spyArgument[1].logger;
    expect(logger).to.be.instanceof(Logger);
    expect(logger.rewriters).to.have.lengthOf(sampleLogger.rewriters.length + 1);
    expect(logger.filters).to.have.lengthOf(sampleLogger.filters.length + 1);

    // wrapped logger will modify the log messages in filters and update the log meta with trace
    expect(logger.rewriters[logger.rewriters.length - 1]()).to.deep.equal(spyArgument[1].trace);
    expect(logger.filters[logger.filters.length - 1]()).to.be.an('string');
  });

  it('throws error in the decorated handler when handler throw error', async () => {
    // sample handler that throw exception
    const sampleHandlerThrowException = () => {
      throw new Error('fail to run');
    };
    sampleHandlerThrowException.$meta = {
      name: 'sampleHandlerThrowException',
    };
    const sampleHandlerThrowExceptionSpy = sinon.spy(sampleHandlerThrowException);
    const decoratedHandler = decorateBpmnHandler(sampleHandlerThrowExceptionSpy, sampleLogger);
    // expect it will run in the processManager that with processId
    try {
      await decoratedHandler.apply(sampleProcess);
    } catch (err) {
      expect(sampleHandlerThrowExceptionSpy.calledOnce).to.be.true;
      expect(err).to.be.an('error');
    }
  });
});
