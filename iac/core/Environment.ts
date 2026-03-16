export default class Environment {
  private static instance: Environment;

  public readonly STAGE: string;
  public readonly PROJECT_NAME: string;
  public readonly S3_BUCKET_NAME: string;
  public readonly BEDROCK_REGION: string;
  public readonly BEDROCK_MODEL_ID: string;
  public readonly BEDROCK_RUNTIME_ENDPOINT?: string;
  public readonly BEDROCK_ACCESS_KEY_ID?: string; // Just for local development, in production these should be provided by the execution role
  public readonly BEDROCK_SECRET_ACCESS_KEY?: string; // Just for local development, in production these should be provided by the execution role
  public readonly BEDROCK_SESSION_TOKEN?: string; // Just for local development, in production these should be provided by the execution role

  private constructor() {
    this.STAGE = (process.env.STAGE || 'local').toLowerCase();
    this.PROJECT_NAME = process.env.PROJECT_NAME || 'PlantWaterPlanner';
    this.S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'plant-water-planner-bucket';
    this.BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
    this.BEDROCK_RUNTIME_ENDPOINT = process.env.BEDROCK_RUNTIME_ENDPOINT;
    this.BEDROCK_ACCESS_KEY_ID = process.env.BEDROCK_ACCESS_KEY_ID;
    this.BEDROCK_SECRET_ACCESS_KEY = process.env.BEDROCK_SECRET_ACCESS_KEY;
    this.BEDROCK_SESSION_TOKEN = process.env.BEDROCK_SESSION_TOKEN;
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
