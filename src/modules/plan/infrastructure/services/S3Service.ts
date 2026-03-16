import { S3Client, GetObjectCommand, GetObjectCommandInput } from '@aws-sdk/client-s3';
import { inject, injectable } from 'inversify';
import Environment from '../../../../core/utils/Environment';
import { types } from '../../config/types';
import ILogger from '../../../../core/utils/ILogger';

@injectable()
export default class S3Service {
  private s3Client: S3Client;

  constructor(@inject(types.Logger) private logger: ILogger) {
    this.s3Client = new S3Client();
  }

  /**
   * Downloads a file from S3 bucket and returns it as a Buffer
   * @param bucketName - The name of the S3 bucket
   * @param key - The key (path) of the file in the bucket
   * @returns Promise<Buffer> - The file content as a Buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      this.logger.debug(`Attempting to download file from S3 - Bucket: ${Environment.S3_BUCKET_NAME}, Key: ${key}`);
      const params: GetObjectCommandInput = {
        Bucket: Environment.S3_BUCKET_NAME,
        Key: key,
      };

      const command = new GetObjectCommand(params);
      const response = await this.s3Client.send(command);

      if (!response.Body) {
        this.logger.error(`No body in S3 response for key: ${key}`);
        throw new Error(`File not found: ${key} in bucket: ${Environment.S3_BUCKET_NAME}`);
      }

      // Convert the stream to Buffer
      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      this.logger.error(`Error downloading file from S3: ${error}`);
      throw new Error(`Failed to download file from S3: ${error}`);
    }
  }

  /**
   * Downloads a file from S3 bucket and returns it as base64 string
   * @param bucketName - The name of the S3 bucket
   * @param key - The key (path) of the file in the bucket
   * @returns Promise<string> - The file content as base64 string
   */
  async downloadFileAsBase64(key: string): Promise<string> {
    try {
      const buffer = await this.downloadFile(key);
      return buffer.toString('base64');
    } catch (error) {
      this.logger.error(`Error downloading file as base64 from S3: ${error}`);
      throw new Error(`Failed to download file as base64 from S3: ${error}`);
    }
  }

  /**
   * Downloads a file from S3 bucket and returns it as a string
   * @param bucketName - The name of the S3 bucket
   * @param key - The key (path) of the file in the bucket
   * @param encoding - The encoding to use (default: 'utf-8')
   * @returns Promise<string> - The file content as string
   */
  async downloadFileAsString(key: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    const buffer = await this.downloadFile(key);
    return buffer.toString(encoding);
  }

  /**
   * Checks if a file exists in S3 bucket
   * @param bucketName - The name of the S3 bucket
   * @param key - The key (path) of the file in the bucket
   * @returns Promise<boolean> - True if file exists, false otherwise
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const params: GetObjectCommandInput = {
        Bucket: Environment.S3_BUCKET_NAME,
        Key: key,
      };

      const command = new GetObjectCommand(params);
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}
