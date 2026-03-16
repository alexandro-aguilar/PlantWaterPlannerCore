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
const mockIdentifyPlantController = {
  execute: jest.fn().mockResolvedValue({ statusCode: 200, body: '{"result":"fern"}' }),
};
const mockContainerGet = jest.fn((token) => {
  const { types } = jest.requireActual('../../../../../../src/modules/plan/config/types');
  if (token === types.Logger) return mockLogger;
  if (token === types.TracerService) return mockTracerService;
  if (token === types.PlantIdentifyPlantController) return mockIdentifyPlantController;
  return undefined;
});

jest.mock('../../../../../../src/modules/plan/config/container', () => {
  return {
    container: {
      get: mockContainerGet,
    },
  };
});

describe('IdentifyPlantHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockIdentifyPlantController.execute.mockResolvedValue({ statusCode: 200, body: '{"result":"fern"}' });
  });

  it('given request when handling then delegates to controller', async () => {
    // Given
    const { handler } = await import('../../../../../../src/modules/plan/interface/handlers/IdentifyPlantHandler');
    const { types } = await import('../../../../../../src/modules/plan/config/types');
    const event: any = { body: JSON.stringify({ plant: 'key' }) };
    const context: any = { awsRequestId: 'req-2' };

    // When
    const response: any = await handler(event, context);

    // Then
    expect(mockContainerGet).toHaveBeenCalledWith(types.Logger);
    expect(mockContainerGet).toHaveBeenCalledWith(types.PlantIdentifyPlantController);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('{"result":"fern"}');
    expect(mockLogger.addContext).toHaveBeenCalledWith({ requestId: 'req-2' });
    expect(mockIdentifyPlantController.execute).toHaveBeenCalledWith(event);
  });
});

export {};
