import 'reflect-metadata';
import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { useExpressServer, getMetadataArgsStorage } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import swaggerUi from 'swagger-ui-express';
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS } from '@/config/env';
import { ErrorMiddleware } from '@/middlewares/exception';
import { logger, stream } from '@/shared/utils/helpers/loggers';
import actuator from 'express-actuator';
import { rateLimitMiddleware } from './middlewares/security/rateLimit';
import traceMiddleware from './middlewares/loggers/trace';
import httpLoggerMiddleware from './middlewares/loggers/http';
import { ipTrackerMiddleware } from './middlewares/security/ipTracker';
import { throttlingMiddleware } from './middlewares/security/throttling';
import { TRPCAppRouter } from './modules/app.Module';
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './config/trpc';

type ShutdownTask = () => Promise<void>;

export class App {
	public app: express.Application;
	public env: string;
	public port: string | number;
	private _initializeDatabase: Function;

	constructor() {
		this.app = express();
		this.env = NODE_ENV || 'development';
		this.port = PORT || 3000;

		this.initializeMiddlewares();
	}

	public initializeRestApiRoutes(controllers: Function[]) {
		useExpressServer(this.app, {
			cors: {
				origin: ORIGIN,
				credentials: CREDENTIALS,
			},
			controllers: controllers,
			defaultErrorHandler: false,
		});
		logger.info(`======= ✅ initialized rest api routes =======`);

		this.initializeSwagger(controllers);

		return this;
	}

	public initializeTrpcRoutes(appRouter: TRPCAppRouter | undefined | null) {
		if (appRouter) {
			this.app.use(
				'/trpc',
				trpcExpress.createExpressMiddleware({
					router: appRouter,
					createContext,
					allowMethodOverride: true,
				})
			);

			logger.info(`======= ✅ initialized trpc routes =======`);
		}
		return this;
	}

	public initializeDatabase(init?: Function | undefined) {
		this._initializeDatabase = init;
		return this;
	}

	public initializeErrorHandling() {
		this.app.use(ErrorMiddleware);
		logger.info(`======= ✅ initialized error handling =======`);

		return this;
	}

	public listen() {
		this.app.listen(this.port, async () => {
			logger.info(`✅=================================✅`);
			logger.info(`======= ENV: ${this.env} =======`);
			logger.info(`🚀 App listening on the port ${this.port}`);
			logger.info(`✅=================================✅`);

			await this.executeDatabase();

			logger.info(`=== ✅ Server Started. Good to go ===`);
			logger.info(`===🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀===`);
		});

		return this;
	}

	public getServer() {
		return this.app;
	}

	private initializeMiddlewares() {
		this.app.set('trust proxy', true); // trust first proxy for rate limiting
		this.app.use(httpLoggerMiddleware);
		this.app.use(hpp());
		this.app.use(helmet());
		this.app.use(compression());
		this.app.use(express.json({ limit: '50mb' }));
		this.app.use(express.urlencoded({ extended: true }));
		this.app.use(cookieParser());
		this.app.use(actuator());
		this.app.use(rateLimitMiddleware);
		this.app.use(traceMiddleware);
		this.app.use(throttlingMiddleware);
		this.app.use(ipTrackerMiddleware);
		this.app.disable('x-powered-by');

		logger.info(`======= ✅ initialized middlewares =======`);
	}

	private initializeSwagger(controllers: Function[]) {
		const schemas = validationMetadatasToSchemas({
			classTransformerMetadataStorage: defaultMetadataStorage,
			refPointerPrefix: '#/components/schemas/',
		});

		const routingControllersOptions = {
			controllers: controllers,
		};

		const storage = getMetadataArgsStorage();
		const spec = routingControllersToSpec(storage, routingControllersOptions, {
			components: {
				schemas: schemas as { [schema: string]: any },
				securitySchemes: {
					// basicAuth: {
					//   scheme: 'basic',
					//   type: 'http',
					// },
					BearerAuth: {
						type: 'http',
						scheme: 'bearer',
						bearerFormat: 'JWT',
						in: 'header',
					},
				},
			},
			security: [
				{
					BearerAuth: [],
				},
			],
			info: {
				description: 'Generated with `routing-controllers-openapi`',
				title: 'A sample API',
				version: '1.0.0',
			},
		});
		//console.log(JSON.stringify(spec));
		this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
		logger.info(`======= ✅ initialized swagger =======`);
	}

	private async executeDatabase(): Promise<void> {
		if (this._initializeDatabase) {
			await this._initializeDatabase();
			logger.info(`=======✅ initialized database =======`);
		}
	}

	public gracefulShutdown(shutDownTasks?: ShutdownTask) {
		const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

		for (const signal of signals) {
			process.once(signal, () => {
				logger.info(`🚦 Received ${signal}. Starting graceful shutdown...`);

				const server = this.app.listen(this.port);

				server.close(async () => {
					logger.info('🛑 HTTP server closed.');

					try {
						if (shutDownTasks) {
							await shutDownTasks(); // Execute your custom teardown logic
							logger.info('✅ Shutdown task completed. Exiting process.');
						} else {
							logger.info('❌ Shutdown task not found. Exiting process.');
						}
					} catch (err) {
						logger.error('❌ Shutdown task failed:', err);
					}

					process.exit(0);
				});

				setTimeout(() => {
					logger.error('⏱ Force exit after timeout.');
					process.exit(1);
				}, 5000).unref();
			});
		}
	}
}
