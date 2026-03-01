import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import GeneratePlanLambda from './lambda/GeneratePlanLambda';
import CoreApiGateway from './apiGateway/CoreApiGateway';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import IdentifyPlantLambda from './lambda/IdentifyPlantLambda';
import Environment from './core/Environment';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import PlantWaterPlannerBucket from './s3/PlantWaterPlannerBucket';
import GenerateS3PresignedUrlLambda from './lambda/GenerateS3PresignedUrlLambda';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

export class PlantWaterPlannerCoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    if (Environment.current.STAGE === 'local') {
      new Bucket(this, 'PlantWaterPlannerHotReloadBucket', {
        bucketName: 'hot-reload',
      });
    }

    const openAiSecret = Secret.fromSecretCompleteArn(this, 'OpenAISecret', Environment.current.OPENAI_SECRET_ARN);

    const bucket = new PlantWaterPlannerBucket(
      this,
      `${Environment.current.S3_BUCKET_NAME}-${Environment.current.STAGE}`
    );

    const api = new CoreApiGateway(this, `PlantWaterPlannerCoreApiGateway-${Environment.current.STAGE}`);

    const role = new Role(this, `GeneratePlanLambdaRole-${Environment.current.STAGE}`, {
      roleName: `GeneratePlanLambdaRole-${Environment.current.STAGE}`,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
    });

    const generatePlanLambda = new GeneratePlanLambda(this, `GeneratePlanLambda-${Environment.current.STAGE}`, {
      role,
      api,
    });

    new IdentifyPlantLambda(this, `IdentifyPlantLambda-${Environment.current.STAGE}`, {
      role,
      api,
      bucket,
    });

    new GenerateS3PresignedUrlLambda(this, `GenerateS3PresignedUrlLambda-${Environment.current.STAGE}`, {
      role,
      bucket,
      api,
    });

    openAiSecret.grantRead(generatePlanLambda);

    new cdk.CfnOutput(this, `ApiGatewayUrl-${Environment.current.STAGE}`, {
      value: api.apiEndpoint ?? 'unknown-endpoint',
      exportName: `${id}-ApiGatewayUrl-${Environment.current.STAGE}`,
      description: 'HTTP API endpoint for the core API gateway',
    });

    new cdk.CfnOutput(this, `S3BucketName-${Environment.current.STAGE}`, {
      value: bucket.bucketName,
      exportName: `${id}-S3BucketName-${Environment.current.STAGE}`,
      description: 'Primary S3 bucket name for the Plant Water Planner',
    });
  }
}
