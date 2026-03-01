import { Construct } from 'constructs';
import BaseLambdaFunction from '../core/BaseLambdaFunction';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { resolve } from 'path';
import { Duration } from 'aws-cdk-lib';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpMethod, HttpRoute, HttpRouteKey } from 'aws-cdk-lib/aws-apigatewayv2';
import GeneratePlanLambdaProps from './GeneratePlanLambdaProps';

export default class GeneratePlanLambda extends BaseLambdaFunction {
  constructor(scope: Construct, id: string, props: GeneratePlanLambdaProps) {
    super(scope, id, {
      functionName: `${id}`,
      runtime: Runtime.NODEJS_24_X,
      handler: 'GeneratePlanHandler.handler',
      code: resolve(__dirname, '../../.dist/src/modules/plan/interface/handlers'),
      role: props.role,
      memorySize: 1024,
      timeout: Duration.seconds(30),
      environment: {
        POWERTOOLS_SERVICE_NAME: `${id}`,
      },
    });

    const integration = new HttpLambdaIntegration(`${id}Integration`, this);

    new HttpRoute(scope, `${id}Route`, {
      httpApi: props.api,
      routeKey: HttpRouteKey.with('/plan', HttpMethod.POST),
      integration,
    });
  }
}
