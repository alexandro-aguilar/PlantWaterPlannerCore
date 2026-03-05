import { inject, injectable } from 'inversify';
import ILogger from '../../../core/utils/ILogger';
import { types } from '../config/types';
import PlantImageAnalizeOpenAi from '../infrastructure/services/PlantImageAnalizeOpenAi';
import S3Service from '../infrastructure/services/S3Service';
import Environment from '../../../core/utils/Environment';
import SecretsManagerService from '../infrastructure/services/SecretsManagerService';

@injectable()
export default class IdentifyPlanUseCase {
  constructor(
    @inject(types.Logger) private logger: ILogger,
    @inject(types.PlantImageAnalizeOpenAi) private plantImageAnalizeOpenAi: PlantImageAnalizeOpenAi,
    @inject(types.S3Service) private s3Service: S3Service,
    @inject(types.SecretsManagerService) private secretsManagerService: SecretsManagerService
  ) {}

  async execute(plantUrl: string): Promise<string> {
    try {
      if (!Environment.OPENAI_API_KEY) {
        const secret = await this.secretsManagerService.getSecretValueByArn(Environment.OPENAI_SECRET_ARN);
        Environment.OPENAI_API_KEY = JSON.parse(secret).value;
      }
      this.logger.info('Starting plant identification process', { plantUrl });
      const imageBase64 = await this.s3Service.downloadFileAsBase64(plantUrl);
      this.logger.info('Starting plant identification with OpenAI');
      const identificationResult = await this.plantImageAnalizeOpenAi.identifyPlants(imageBase64);
      const parsedResult = JSON.parse(identificationResult);
      this.logger.info('Plant identification completed', { parsedResult });
      return parsedResult;
    } catch (error) {
      this.logger.error('Error in IdentifyPlanUseCase execute:', { error });
      throw error;
    }
  }
}
