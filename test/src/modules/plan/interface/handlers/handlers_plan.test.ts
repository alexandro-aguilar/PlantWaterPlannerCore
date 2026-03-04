jest.mock('@aws-lambda-powertools/tracer/middleware', () => ({
  captureLambdaHandler: () => (handler: any) => handler,
}));

jest.mock('@middy/core', () => {
  const middyFn = (handler: any) => {
    const wrapped = (...args: any[]) => handler(...args);
    (wrapped as any).use = () => wrapped;
    return wrapped;
  };
  return { __esModule: true, default: middyFn };
});

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  addContext: jest.fn(),
};

const mockTracerService = { tracer: { name: 'tracer' } };

jest.mock('../../../../../../src/modules/plan/config/container', () => {
  const { types } = jest.requireActual('../../../../../../src/modules/plan/config/types');
  return {
    container: {
      get: jest.fn((token) => {
        if (token === types.Logger) return mockLogger;
        if (token === types.TracerService) return mockTracerService;
        if (token === types.GeneratePlanController) return { execute: jest.fn().mockResolvedValue('plan-json') };
        if (token === types.PlantIdentifyPlantController)
          return { execute: jest.fn().mockResolvedValue({ statusCode: 200, body: '{}' }) };
        return undefined;
      }),
    },
  };
});

describe('IdentifyPlantHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('given request when handling then delegates to controller', async () => {
    // Given
    const { handler } = await import('../../../../../../src/modules/plan/interface/handlers/IdentifyPlantHandler');
    const event: any = { body: JSON.stringify({ plant: 'key' }) };
    const context: any = { awsRequestId: 'req-2' };

    // When
    const response: any = await handler(event, context);

    // Then
    expect(response.statusCode).toBe(200);
    expect(mockLogger.addContext).toHaveBeenCalledWith({ requestId: 'req-2' });
  });
});

export {};
