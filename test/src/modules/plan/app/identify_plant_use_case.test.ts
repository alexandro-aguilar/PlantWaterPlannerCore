import IdentifyPlantUseCase from '../../../../../src/modules/plan/app/IdentifyPlantUseCase';
import Environment from '../../../../../src/core/utils/Environment';

const logger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  addContext: jest.fn(),
};

const plantImageAnalizeOpenAi = {
  identifyPlants: jest.fn(),
};

const s3Service = {
  downloadFileAsBase64: jest.fn(),
};

const secretsManagerService = {
  getSecretValueByArn: jest.fn(),
};

describe('IdentifyPlantUseCase', () => {
  const originalOpenAiApiKey = Environment.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    Environment.OPENAI_API_KEY = 'existing-api-key';
  });

  afterAll(() => {
    Environment.OPENAI_API_KEY = originalOpenAiApiKey;
  });

  it('given valid s3 key when executing then returns parsed identification result', async () => {
    // Given
    const key = 'images/plant.jpg';
    const encoded = 'BASE64';
    const aiResult = JSON.stringify({ plant: { name: 'Fern' } });
    s3Service.downloadFileAsBase64.mockResolvedValue(encoded);
    plantImageAnalizeOpenAi.identifyPlants.mockResolvedValue(aiResult);
    const useCase = new IdentifyPlantUseCase(
      logger as any,
      plantImageAnalizeOpenAi as any,
      s3Service as any,
      secretsManagerService as any
    );

    // When
    const result = await useCase.execute(key);

    // Then
    expect(secretsManagerService.getSecretValueByArn).not.toHaveBeenCalled();
    expect(s3Service.downloadFileAsBase64).toHaveBeenCalledWith(key);
    expect(plantImageAnalizeOpenAi.identifyPlants).toHaveBeenCalledWith(encoded);
    expect(result).toEqual({ plant: { name: 'Fern' } });
    expect(logger.info).toHaveBeenCalledWith('Plant identification completed', {
      parsedResult: { plant: { name: 'Fern' } },
    });
  });

  it('given missing openai api key when executing then loads it from secrets manager before identifying plant', async () => {
    // Given
    const key = 'images/plant.jpg';
    const encoded = 'BASE64';
    const aiResult = JSON.stringify({ plant: { name: 'Monstera' } });
    Environment.OPENAI_API_KEY = undefined;
    secretsManagerService.getSecretValueByArn.mockResolvedValue(JSON.stringify({ value: 'secret-api-key' }));
    s3Service.downloadFileAsBase64.mockResolvedValue(encoded);
    plantImageAnalizeOpenAi.identifyPlants.mockResolvedValue(aiResult);
    const useCase = new IdentifyPlantUseCase(
      logger as any,
      plantImageAnalizeOpenAi as any,
      s3Service as any,
      secretsManagerService as any
    );

    // When
    const result = await useCase.execute(key);

    // Then
    expect(secretsManagerService.getSecretValueByArn).toHaveBeenCalledWith(Environment.OPENAI_SECRET_ARN);
    expect(Environment.OPENAI_API_KEY).toBe('secret-api-key');
    expect(s3Service.downloadFileAsBase64).toHaveBeenCalledWith(key);
    expect(plantImageAnalizeOpenAi.identifyPlants).toHaveBeenCalledWith(encoded);
    expect(result).toEqual({ plant: { name: 'Monstera' } });
  });

  it('given downstream failure when executing then logs error and rethrows', async () => {
    // Given
    const err = new Error('boom');
    s3Service.downloadFileAsBase64.mockRejectedValue(err);
    const useCase = new IdentifyPlantUseCase(
      logger as any,
      plantImageAnalizeOpenAi as any,
      s3Service as any,
      secretsManagerService as any
    );

    // When / Then
    await expect(useCase.execute('x')).rejects.toThrow('boom');
    expect(logger.error).toHaveBeenCalled();
  });
});
