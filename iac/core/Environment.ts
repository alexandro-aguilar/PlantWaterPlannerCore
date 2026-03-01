export default class Environment {
  private static instance: Environment;

  public readonly STAGE: string;
  public readonly PROJECT_NAME: string;
  public readonly OPENAI_API_KEY: string;
  public readonly S3_BUCKET_NAME: string;
  public readonly OPENAI_SECRET_ARN: string;

  private constructor() {
    this.STAGE = (process.env.STAGE || 'local').toLowerCase();
    this.PROJECT_NAME = process.env.PROJECT_NAME || 'PlantWaterPlanner';
    this.OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
    this.S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'plant-water-planner-bucket';
    this.OPENAI_SECRET_ARN = process.env.OPENAI_SECRET_ARN || '';
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
