import { WorkerBullMq, WorkerCronJob } from '@kishornaik/utils';
import { CreateUserEndpoint } from './apps/features/v1/createUsers';
import { publishWelcomeUserEmailIntegrationEventJob } from './apps/features/v1/createUsers/job';
import { subscribeUserSharedCacheDomainEvent } from './shared/cache/events/subscribe';

const userModules: Function[] = [CreateUserEndpoint];
const userCronJobModules: WorkerCronJob[] = [publishWelcomeUserEmailIntegrationEventJob];
const userBullMqModules: WorkerBullMq[] = [subscribeUserSharedCacheDomainEvent];

export { userModules, userCronJobModules, userBullMqModules };
