import { mergeRouters } from '@/config/trpc';
import {
	WorkerBullMq,
	WorkerCronJob,
	WorkerKafka,
	WorkerPusher,
	WorkerRabbitMq,
} from '@kishornaik/utils';
import { userCronJobModules, userModules } from './users/users.Module';
import { notificationBullMqModules } from './notifications/notification.Module';

// REST API
const restApiModulesFederation: Function[] = [...userModules];

// TRPC
const trpcModulesFederation = mergeRouters();
type TRPCAppRouter = typeof trpcModulesFederation;

// Workers
const cronJobWorkerModules: WorkerCronJob[] = [...userCronJobModules];
const bullMqWorkerModules: WorkerBullMq[] = [...notificationBullMqModules];
const pusherWorkerModules: WorkerPusher[] = [];
const rabbitMqWorkerModules: WorkerRabbitMq[] = [];
const kafkaWorkerModules: WorkerKafka[] = [];

export {
	restApiModulesFederation,
	trpcModulesFederation,
	TRPCAppRouter,
	cronJobWorkerModules,
	bullMqWorkerModules,
	pusherWorkerModules,
	rabbitMqWorkerModules,
	kafkaWorkerModules,
};
