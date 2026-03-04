import IdentifyPlantController from '../../../../../../src/modules/plan/interface/controllers/IdentifyPlantController';

const logger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  addContext: jest.fn(),
};

describe('IdentifyPlantController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('given valid request when executing then returns 200 with result', async () => {
    // Given
    const useCase = { execute: jest.fn().mockResolvedValue({ ok: true }) };
    const controller = new IdentifyPlantController(logger as any, useCase as any);
    const event: any = { body: JSON.stringify({ plant: 'key' }) };

    // When
    const response: any = await controller.execute(event);

    // Then
    expect(useCase.execute).toHaveBeenCalledWith('key');
    expect(response.statusCode).toBe(200);
  });

  it('given failure when executing then returns 500', async () => {
    // Given
    const useCase = { execute: jest.fn().mockRejectedValue(new Error('bad')) };
    const controller = new IdentifyPlantController(logger as any, useCase as any);
    const event: any = { body: JSON.stringify({ plant: 'key' }) };

    // When
    const response: any = await controller.execute(event);

    // Then
    expect(response.statusCode).toBe(500);
    expect(logger.error).toHaveBeenCalled();
  });
});

export {};
