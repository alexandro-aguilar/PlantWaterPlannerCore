import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { inject, injectable } from 'inversify';
import ILogger from '../../../../core/utils/ILogger';
import Environment from '../../../../core/utils/Environment';
import { types } from '../../config/types';

@injectable()
export default class PlantImageAnalizeBedrock {
  private bedrockClient: BedrockRuntimeClient;

  constructor(@inject(types.Logger) private logger: ILogger) {}

  private async analyzeImage(imageBytes: Buffer, prompt: string): Promise<string> {
    try {
      const response = await this.bedrockClient.send(
        new ConverseCommand({
          modelId: Environment.BEDROCK_MODEL_ID,
          messages: [
            {
              role: 'user',
              content: [
                {
                  image: {
                    format: 'jpeg',
                    source: { bytes: imageBytes },
                  },
                },
                { text: prompt },
              ],
            },
          ],
        })
      );
      this.logger.info('Bedrock response received', { response });
      return response.output?.message?.content?.at(0)?.text ?? '';
    } catch (error) {
      this.logger.error('Error in analyzeImage:', { error });
      throw error;
    }
  }

  async identifyPlants(imageBytes: Buffer): Promise<string> {
    this.logger.info('hola');
    try {
      this.logger.info('Initializing BedrockRuntimeClient', {
        region: Environment.BEDROCK_REGION,
        endpoint: Environment.BEDROCK_RUNTIME_ENDPOINT,
      });
      this.bedrockClient = new BedrockRuntimeClient({
        region: Environment.BEDROCK_REGION,
        endpoint: Environment.BEDROCK_RUNTIME_ENDPOINT,
      });
      this.logger.info('Starting plant identification with Bedrock', { imageSize: imageBytes.length });
      const prompt = `Analyze this image and identify just a plant. 
    Respond strictly in **English**.
    For the identified plant provide:
    - Common name
    - Scientific name
    - Sunlight preference (e.g., full sun, partial sun, shade)
    - Watering recommendations (frequency in days)
    - Apparent condition of the plant (healthy, needs water, etc.)
    - Short care notes (tips to keep it healthy)
    
    Return the response in JSON format with the following structure:
    {
      "plant": {
        "name": "string",
        "scientific_name": "string",
        "sunlight_preference": "string",
        "watering_frequency_days": number,
        "current_condition": "string",
      "care_notes": "string"
      }
    }`;
      const response = await this.analyzeImage(imageBytes, prompt);
      return response;
    } catch (error) {
      this.logger.error('Error in identifyPlants:', { error });
      throw error;
    }
  }
}
