export default class Environment {
  private static instance: Environment;

  public readonly STAGE: string;
  public readonly PROJECT_NAME: string;
  public readonly OPENAI_API_KEY: string;
  public readonly S3_BUCKET_NAME: string;
  public readonly OPENAI_SECRET_ARN: string;
  public readonly BEDROCK_REGION: string;
  public readonly BEDROCK_MODEL_ID: string;
  public readonly BEDROCK_RUNTIME_ENDPOINT: string;

  private constructor() {
    this.STAGE = (process.env.STAGE || 'local').toLowerCase();
    this.PROJECT_NAME = process.env.PROJECT_NAME || 'PlantWaterPlanner';
    this.OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
    this.S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'plant-water-planner-bucket';
    this.OPENAI_SECRET_ARN = process.env.OPENAI_SECRET_ARN || '';
    this.BEDROCK_REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';
    this.BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
    this.BEDROCK_RUNTIME_ENDPOINT =
      process.env.BEDROCK_RUNTIME_ENDPOINT || `https://bedrock-runtime.${this.BEDROCK_REGION}.amazonaws.com`;
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  // Convenience method to get the instance and access properties directly
  public static get current(): Environment {
    return Environment.getInstance();
  }
}
