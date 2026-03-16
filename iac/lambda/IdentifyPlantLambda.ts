import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpMethod, HttpRoute, HttpRouteKey } from 'aws-cdk-lib/aws-apigatewayv2';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { resolve } from 'path';
import BaseLambdaFunction from '../core/BaseLambdaFunction';
import Environment from '../core/Environment';
import GeneratePlanLambdaProps from './GeneratePlanLambdaProps';

export default class IdentifyPlantLambda extends BaseLambdaFunction {
  private static getBedrockInvokeResources(modelId: string): string[] {
    if (modelId.startsWith('arn:')) {
      return [modelId];
    }

    return [
      'arn:aws:bedrock:*::foundation-model/*',
      'arn:aws:bedrock:*:*:inference-profile/*',
      'arn:aws:bedrock:*:*:application-inference-profile/*',
    ];
  }

  constructor(scope: Construct, id: string, props: GeneratePlanLambdaProps) {
    super(scope, id, {
      functionName: `${id}`,
      runtime: Runtime.NODEJS_24_X,
      handler: 'IdentifyPlantHandler.handler',
      code: resolve(__dirname, '../../.dist/src/modules/plan/interface/handlers'),
      role: props.role,
      memorySize: 1024,
      timeout: Duration.seconds(60),
      environment: {
        TMP_KEY_PREFIX: 'guest/', //move it to environment file
        POWERTOOLS_SERVICE_NAME: `${id}`,
        S3_BUCKET_NAME: props.bucket?.bucketName as string,
        STAGE: Environment.current.STAGE,
        BEDROCK_REGION: Environment.current.BEDROCK_REGION,
        BEDROCK_MODEL_ID: Environment.current.BEDROCK_MODEL_ID,
        // LocalStack-specific environment variables
        ...(Environment.current.STAGE === 'local' && {
          NODE_TLS_REJECT_UNAUTHORIZED: '0',
          BEDROCK_RUNTIME_ENDPOINT: Environment.current.BEDROCK_RUNTIME_ENDPOINT,
          BEDROCK_ACCESS_KEY_ID: Environment.current.BEDROCK_ACCESS_KEY_ID, // Just for local development, in production these should be provided by the execution role
          BEDROCK_SECRET_ACCESS_KEY: Environment.current.BEDROCK_SECRET_ACCESS_KEY, // Just for local development, in production these should be provided by the execution role
          BEDROCK_SESSION_TOKEN: Environment.current.BEDROCK_SESSION_TOKEN, // Just for local development, in production these should be provided by the execution role
        }),
      },
    });

    const s3AccessPolicy = new Policy(scope, `${id}LambdaS3AccessPolicy`, {
      statements: [
        new PolicyStatement({
          actions: ['s3:GetObject'],
          resources: [`${props.bucket?.bucketArn}/*`],
        }),
      ],
    });

    this.role?.attachInlinePolicy(s3AccessPolicy);

    const bedrockAccessPolicy = new Policy(scope, `${id}LambdaBedrockAccessPolicy`, {
      statements: [
        new PolicyStatement({
          actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
          resources: IdentifyPlantLambda.getBedrockInvokeResources(Environment.current.BEDROCK_MODEL_ID),
        }),
      ],
    });

    this.role?.attachInlinePolicy(bedrockAccessPolicy);

    const integration = new HttpLambdaIntegration(`${id}Integration`, this);

    new HttpRoute(scope, `${id}Route`, {
      httpApi: props.api,
      routeKey: HttpRouteKey.with('/identify', HttpMethod.POST),
      integration,
    });
  }
}
