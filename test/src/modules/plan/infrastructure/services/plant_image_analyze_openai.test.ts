import PlantImageAnalizeOpenAi from '../../../../../../src/modules/plan/infrastructure/services/PlantImageAnalizeOpenAi';
import Environment from '../../../../../../src/core/utils/Environment';

const logger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  addContext: jest.fn(),
};

describe('PlantImageAnalizeOpenAi', () => {
  const originalOpenAiApiKey = Environment.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    Environment.OPENAI_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    Environment.OPENAI_API_KEY = originalOpenAiApiKey;
  });

  it('given valid image when identifying plants then delegates to analyzeImage and returns response', async () => {
    // Given
    const service = new PlantImageAnalizeOpenAi(logger as any);
    const analyzeSpy = jest.spyOn(service as any, 'analyzeImage').mockResolvedValue('result-json');

    // When
    const result = await service.identifyPlants('abc');

    // Then
    expect(analyzeSpy).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('imageBase64 Analize', { length: 3 });
    expect(result).toBe('result-json');
  });

  it('given analyzeImage throws when identifying plants then logs and rethrows', async () => {
    // Given
    const service = new PlantImageAnalizeOpenAi(logger as any);
    const error = new Error('boom');
    jest.spyOn(service as any, 'analyzeImage').mockRejectedValue(error);

    // When / Then
    await expect(service.identifyPlants('abc')).rejects.toThrow('boom');
    expect(logger.error).toHaveBeenCalled();
  });
});
