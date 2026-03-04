import { OpenAI } from 'openai';
import Environment from '../../../../core/utils/Environment';
import { inject, injectable } from 'inversify';
import ILogger from '../../../../core/utils/ILogger';
import { types } from '../../config/types';

@injectable()
export default class OpenAiVisionService {
  private openAiClient: OpenAI;

  constructor(@inject(types.Logger) private logger: ILogger) {}

  private async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    try {
      const response = await this.openAiClient.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });
      return response.choices[0]?.message?.content ?? '';
    } catch (error) {
      this.logger.error('Error analyzeImage:', { error });
      throw error;
    }
  }

  async identifyPlants(imageBase64: string): Promise<string> {
    this.openAiClient = new OpenAI({
      apiKey: Environment.OPENAI_API_KEY,
    });
    try {
      this.logger.info('imageBase64 Analize', { length: imageBase64.length });
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
      const response = await this.analyzeImage(imageBase64, prompt);
      return response;
    } catch (error) {
      this.logger.error('Error in identifyPlants:', { error });
      throw error;
    }
  }
}
