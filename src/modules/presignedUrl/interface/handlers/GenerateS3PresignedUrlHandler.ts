import 'reflect-metadata';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { container } from '../../config/container';
import { types } from '../../config/types';
import ILogger from '../../../../core/utils/ILogger';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import Environment from '../../../../core/utils/Environment';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const logger: ILogger = container.get(types.Logger);

const s3 = new S3Client();

const response = (status: number, body: unknown) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
  },
  body: JSON.stringify(body),
});

export const handler = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> => {
  logger.addContext({ requestId: context.awsRequestId });

  try {
    const {
      S3_BUCKET_NAME = '',
      TMP_KEY_PREFIX = '',
      PRESIGN_EXPIRES_SECONDS = '60',
      ALLOWED_MIME_TYPES = 'image/jpeg,image/jpg',
    } = Environment;

    const allowed = new Set(
      ALLOWED_MIME_TYPES.split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );

    const allowedExt = new Set(['jpg', 'jpeg']);

    const qs = event?.queryStringParameters || {};
    const rawFilename = (qs.filename || '').toString();
    const contentType = (qs.contentType || '').toString().toLowerCase();

    if (!rawFilename) return response(400, { error: 'filename is required' });
    if (!contentType) return response(400, { error: 'contentType is required' });
    if (!allowed.has(contentType)) {
      return response(415, { error: `contentType '${contentType}' not allowed` });
    }

    const clean = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = clean.split('.').pop()?.toLowerCase() || '';
    if (!allowedExt.has(ext)) {
      return response(415, { error: `file extension '.${ext}' not allowed` });
    }

    // Optional: namespace keys by day/user/ip/etc.
    const key = `${TMP_KEY_PREFIX}${Date.now()}-${clean}`;

    const cmd = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      // Optional: server-side encryption and tagging examples
      // ServerSideEncryption: "AES256",
      // Tagging: "uploadedBy=guest"
    });

    const expiresIn = parseInt(PRESIGN_EXPIRES_SECONDS, 10) || 60;

    const url = await getSignedUrl(s3, cmd, { expiresIn });
    logger.info('Generated presigned URL', { key, url });
    return response(200, { url, key });
    // return {
    //   statusCode: 200,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Access-Control-Allow-Origin': '*',
    //     'Access-Control-Allow-Headers': '*',
    //   },
    //   body: JSON.stringify({ url }),
    // };
  } catch (err: any) {
    console.error(err);
    return response(500, { error: 'internal_error' });
    // return {
    //   statusCode: 500,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Access-Control-Allow-Origin': '*',
    //     'Access-Control-Allow-Headers': '*',
    //   },
    //   body: JSON.stringify({ error: 'internal_error' }),
    // };
  }
};
