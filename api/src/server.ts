import { App } from '@/app';
import { ValidateEnv } from '@kishornaik/utils';
import { trpcModulesFederation, restApiModulesFederation } from './modules/app.Module';
import { setDatabase } from './config/db';
//import { destroyDatabase } from '@kishornaik/db';

ValidateEnv();

const runServer = () => {
	new App()
		.initializeRestApiRoutes([...restApiModulesFederation])
		.initializeTrpcRoutes(trpcModulesFederation)
		.initializeDatabase(setDatabase)
		.initializeErrorHandling()
		.listen()
		.gracefulShutdown(async () => {
			//await destroyDatabase();
		});
};

runServer();
