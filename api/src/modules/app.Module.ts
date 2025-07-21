import { mergeRouters } from '@/config/trpc';
import {
	WorkerBullMq,
	WorkerCronJob,
	WorkerKafka,
	WorkerPusher,
	WorkerRabbitMq,
} from '@kishornaik/utils';
import { userBullMqWorkerModules, userModules } from './domain/users/users.Module';
import { orderBullMqWorkerModules, orderModules } from './domain/orders/orders.Module';
import { dashboardModules } from './bff/dashboards/dashboard.Module';

// REST API
const restApiModulesFederation: Function[] = [...userModules, ...orderModules, ...dashboardModules];

// TRPC
const trpcModulesFederation = mergeRouters();
type TRPCAppRouter = typeof trpcModulesFederation;

// Workers
const cronJobWorkerModules: WorkerCronJob[] = [];
const bullMqWorkerModules: WorkerBullMq[] = [
	...userBullMqWorkerModules,
	...orderBullMqWorkerModules,
];
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
