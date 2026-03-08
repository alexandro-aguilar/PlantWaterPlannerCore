export default class Environment {
  static readonly STAGE = process.env.STAGE || 'local';
  static OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  static readonly OPENAI_SECRET_ARN = process.env.OPENAI_SECRET_ARN || '';
  static readonly POWERTOOLS_SERVICE_NAME = process.env.POWERTOOLS_SERVICE_NAME || 'plant-water-planner-core';
  static readonly POWERTOOLS_LOG_LEVEL = process.env.POWERTOOLS_LOG_LEVEL || 'INFO';
  static readonly PROJECT_NAME = process.env.PROJECT_NAME || 'PlantWaterPlanner';
  static readonly AWS_REGION = process.env.AWS_REGION || 'us-east-1';
  static readonly BEDROCK_REGION = process.env.BEDROCK_REGION || Environment.AWS_REGION;
  static readonly BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
  static readonly BEDROCK_RUNTIME_ENDPOINT =
    process.env.BEDROCK_RUNTIME_ENDPOINT || `https://bedrock-runtime.${Environment.BEDROCK_REGION}.amazonaws.com`;
  static readonly S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'plant-water-planner-bucket';
  static readonly KEY_PREFIX = process.env.KEY_PREFIX || '';
  static readonly PRESIGN_EXPIRES_SECONDS = process.env.PRESIGN_EXPIRES_SECONDS || '60';
  static readonly ALLOWED_MIME_TYPES = process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,application/pdf';
  static readonly TMP_KEY_PREFIX = process.env.TMP_KEY_PREFIX || 'tmp/';

  // Initialize LocalStack-specific settings
  static {
    if (Environment.STAGE === 'local') {
      // Disable TLS verification for LocalStack
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
  }
}
