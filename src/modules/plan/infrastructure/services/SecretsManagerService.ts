import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import ILogger from '../../../../core/utils/ILogger';
import { types } from '../../config/types';
import { inject } from 'inversify';

export default class SecretsManagerService {
  private secretsManagerClient: SecretsManagerClient;

  constructor(@inject(types.Logger) private logger: ILogger) {
    this.secretsManagerClient = new SecretsManagerClient({ region: process.env.AWS_REGION });
  }

  async getSecretValueByArn(arn: string): Promise<string> {
    const command = new GetSecretValueCommand({ SecretId: arn });
    const response = await this.secretsManagerClient.send(command);
    this.logger.info('Secret value retrieved successfully', { response });
    if (!response.SecretString) {
      throw new Error('SecretString missing');
    }
    return response.SecretString;
  }
}
