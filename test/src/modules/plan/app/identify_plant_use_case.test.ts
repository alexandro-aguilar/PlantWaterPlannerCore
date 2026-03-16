import IdentifyPlantUseCase from '../../../../../src/modules/plan/app/IdentifyPlantUseCase';

const logger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  addContext: jest.fn(),
};

const plantImageAnalizeBedrock = {
  identifyPlants: jest.fn(),
};

const s3Service = {
  downloadFile: jest.fn(),
};

describe('IdentifyPlantUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('given valid s3 key when executing then returns parsed identification result', async () => {
    // Given
    const key = 'images/plant.jpg';
    const imageBuffer = Buffer.from('plant-image');
    const aiResult = JSON.stringify({ plant: { name: 'Fern' } });
    s3Service.downloadFile.mockResolvedValue(imageBuffer);
    plantImageAnalizeBedrock.identifyPlants.mockResolvedValue(aiResult);
    const useCase = new IdentifyPlantUseCase(logger as any, s3Service as any, plantImageAnalizeBedrock as any);

    // When
    const result = await useCase.execute(key);

    // Then
    expect(s3Service.downloadFile).toHaveBeenCalledWith(key);
    expect(plantImageAnalizeBedrock.identifyPlants).toHaveBeenCalledWith(imageBuffer);
    expect(result).toEqual({ plant: { name: 'Fern' } });
    expect(logger.info).toHaveBeenCalledWith('Raw Bedrock response', {
      identificationResult: aiResult,
    });
    expect(logger.info).toHaveBeenCalledWith('Plant identification completed', {
      parsedResult: { plant: { name: 'Fern' } },
    });
  });

  it('given bedrock service fails when executing then logs error and rethrows', async () => {
    // Given
    const key = 'images/plant.jpg';
    const imageBuffer = Buffer.from('plant-image');
    const error = new Error('bedrock failed');
    s3Service.downloadFile.mockResolvedValue(imageBuffer);
    plantImageAnalizeBedrock.identifyPlants.mockRejectedValue(error);
    const useCase = new IdentifyPlantUseCase(logger as any, s3Service as any, plantImageAnalizeBedrock as any);

    // When
    // Then
    await expect(useCase.execute(key)).rejects.toThrow('bedrock failed');
    expect(s3Service.downloadFile).toHaveBeenCalledWith(key);
    expect(plantImageAnalizeBedrock.identifyPlants).toHaveBeenCalledWith(imageBuffer);
    expect(logger.error).toHaveBeenCalledWith('Error in IdentifyPlanUseCase execute:', { error });
  });

  it('given s3 download fails when executing then logs error and rethrows', async () => {
    // Given
    const err = new Error('boom');
    s3Service.downloadFile.mockRejectedValue(err);
    const useCase = new IdentifyPlantUseCase(logger as any, s3Service as any, plantImageAnalizeBedrock as any);

    // When / Then
    await expect(useCase.execute('x')).rejects.toThrow('boom');
    expect(plantImageAnalizeBedrock.identifyPlants).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Error in IdentifyPlanUseCase execute:', { error: err });
  });
});
