import { WorkerBullMq } from '@kishornaik/utils';
import { subscribeWelcomeUserEmailIntegrationEvent } from './apps/features/v1/welcomeUserEmail';

const notificationBullMqModules: WorkerBullMq[] = [subscribeWelcomeUserEmailIntegrationEvent];

export { notificationBullMqModules };
