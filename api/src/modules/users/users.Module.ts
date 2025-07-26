import { WorkerCronJob } from '@kishornaik/utils';
import { CreateUserEndpoint } from './apps/features/v1/createUsers';
import { publishWelcomeUserEmailIntegrationEventJob } from './apps/features/v1/createUsers/job';

const userModules: Function[] = [CreateUserEndpoint];
const userCronJobModules: WorkerCronJob[] = [publishWelcomeUserEmailIntegrationEventJob];

export { userModules, userCronJobModules };
