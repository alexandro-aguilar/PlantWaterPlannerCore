import 'reflect-metadata';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import ILogger from '../../../../core/utils/ILogger';
import { container } from '../../config/container';
import { types } from '../../config/types';
import IdentifyPlantController from '../controllers/IdentifyPlantController';

const logger: ILogger = container.get(types.Logger);

export const handler = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> => {
  logger.addContext({ requestId: context.awsRequestId });

  const identifyPlantController = container.get<IdentifyPlantController>(types.PlantIdentifyPlantController);
  const response = await identifyPlantController.execute(event);
  return response;
};
