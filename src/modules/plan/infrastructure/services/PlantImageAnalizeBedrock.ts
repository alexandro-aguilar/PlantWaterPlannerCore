import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { inject, injectable } from 'inversify';
import ILogger from '../../../../core/utils/ILogger';
import Environment from '../../../../core/utils/Environment';
import { types } from '../../config/types';

@injectable()
export default class PlantImageAnalizeBedrock {
  private bedrockClient: BedrockRuntimeClient;

  constructor(@inject(types.Logger) private logger: ILogger) {
    this.bedrockClient =
      Environment.STAGE === 'local'
        ? new BedrockRuntimeClient({
            region: Environment.BEDROCK_REGION,
            endpoint: Environment.BEDROCK_RUNTIME_ENDPOINT,
            credentials: {
              accessKeyId: Environment.BEDROCK_ACCESS_KEY_ID as string,
              secretAccessKey: Environment.BEDROCK_SECRET_ACCESS_KEY as string,
              sessionToken: Environment.BEDROCK_SESSION_TOKEN,
            },
          })
        : new BedrockRuntimeClient({
            region: Environment.BEDROCK_REGION,
          });
  }

  private async analyzeImage(imageBytes: Buffer, prompt: string): Promise<string> {
    try {
      const jsonSchema = {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Common name of the plant' },
          scientific_name: { type: 'string', description: 'Scientific name of the plant' },
          sunlight_preference: { type: 'string', description: 'Sunlight preference of the plant' },
          watering_frequency_days: { type: 'number', description: 'Watering frequency in days' },
          current_condition: { type: 'string', description: 'Current condition of the plant' },
          care_notes: { type: 'string', description: 'Care notes for the plant' },
        },
        required: [
          'name',
          'scientific_name',
          'sunlight_preference',
          'watering_frequency_days',
          'current_condition',
          'care_notes',
        ],
        additionalProperties: false,
      };
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
          outputConfig: {
            textFormat: {
              type: 'json_schema',
              structure: {
                jsonSchema: {
                  schema: JSON.stringify(jsonSchema),
                },
              },
            },
          },
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
    try {
      this.logger.info('Starting plant identification with Bedrock', { imageSize: imageBytes.length });
      const prompt = `Analyze this image and identify just a plant. 
    Respond strictly in **English**.
    For the identified plant provide:
    - Common name
    - Scientific name
    - Sunlight preference (e.g., full sun, partial sun, shade)
    - Watering recommendations (frequency in days)
    - Apparent condition of the plant (healthy, needs water, etc.)
    - Short care notes (tips to keep it healthy)`;
      const response = await this.analyzeImage(imageBytes, prompt);
      return response;
    } catch (error) {
      this.logger.error('Error in identifyPlants:', { error });
      throw error;
    }
  }
}
