import { Container } from 'inversify';
import { types } from './types';
import ILogger from '../../../core/utils/ILogger';
import PowertoolsLoggerAdapter from '../../../core/utils/Logger';
import MetricsService from '../../../core/utils/MetricsService';
import TracerService from '../../../core/utils/TracerService';
import PlantImageAnalizeOpenAi from '../infrastructure/services/PlantImageAnalizeOpenAi';
import IdentifyPlantController from '../interface/controllers/IdentifyPlantController';
import S3Service from '../infrastructure/services/S3Service';
import IdentifyPlanUseCase from '../app/IdentifyPlantUseCase';
import SecretsManagerService from '../infrastructure/services/SecretsManagerService';
import PlantImageAnalizeBedrock from '../infrastructure/services/PlantImageAnalizeBedrock';

export const container = new Container();

container.bind<ILogger>(types.Logger).to(PowertoolsLoggerAdapter).inSingletonScope();
container.bind<MetricsService>(types.MetricsService).to(MetricsService);
container.bind<TracerService>(types.TracerService).to(TracerService);
container.bind<S3Service>(types.S3Service).to(S3Service);
container.bind<SecretsManagerService>(types.SecretsManagerService).to(SecretsManagerService);
container.bind<IdentifyPlantController>(types.PlantIdentifyPlantController).to(IdentifyPlantController);
container.bind<IdentifyPlanUseCase>(types.IdentifyPlantUseCase).to(IdentifyPlanUseCase);
container.bind<PlantImageAnalizeOpenAi>(types.PlantImageAnalizeOpenAi).to(PlantImageAnalizeOpenAi);
container.bind<PlantImageAnalizeBedrock>(types.PlantImageAnalizeBedrock).to(PlantImageAnalizeBedrock);
