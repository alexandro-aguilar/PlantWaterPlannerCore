import { inject, injectable } from 'inversify';
import ILogger from '../../../core/utils/ILogger';
import { types } from '../config/types';
import S3Service from '../infrastructure/services/S3Service';
import PlantImageAnalizeBedrock from '../infrastructure/services/PlantImageAnalizeBedrock';

@injectable()
export default class IdentifyPlanUseCase {
  constructor(
    @inject(types.Logger) private logger: ILogger,
    @inject(types.S3Service) private s3Service: S3Service,
    @inject(types.PlantImageAnalizeBedrock) private plantImageAnalizeBedrock: PlantImageAnalizeBedrock
  ) {}

  async execute(plantUrl: string): Promise<Record<string, unknown>> {
    try {
      this.logger.info('Starting plant identification process', { plantUrl });
      const imageBuffer = await this.s3Service.downloadFile(plantUrl);
      const identificationResult = await this.plantImageAnalizeBedrock.identifyPlants(imageBuffer);
      this.logger.info('Raw Bedrock response', { identificationResult });

      const parsedResult = JSON.parse(identificationResult);
      this.logger.info('Plant identification completed', { parsedResult });
      return parsedResult;
    } catch (error) {
      this.logger.error('Error in IdentifyPlanUseCase execute:', { error });
      throw error;
    }
  }
}
