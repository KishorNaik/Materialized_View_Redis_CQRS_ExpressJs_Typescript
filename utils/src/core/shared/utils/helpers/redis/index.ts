import { createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis';
import { logger } from '../loggers';
import { Ok, Result } from 'neverthrow';
import { ResultError } from '../../exceptions/results';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import CircuitBreaker from 'opossum';
import IORedis from 'ioredis';
import { ConnectionOptions } from 'bullmq';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from '../../../../config/env';
import { ResultFactory, ExceptionsWrapper } from '../../miscellaneous/response';
import { IServiceHandlerAsync } from '../services';
import winston from 'winston';

const circuitBreakerOptions = {
	timeout: 5000, // If Redis takes longer than 5 seconds, trigger a failure
	errorThresholdPercentage: 50, // If 50% of requests fail, open the circuit
	resetTimeout: 10000, // After 10 seconds, attempt to close the circuit
	maxFailures: 3, // Number of failures before the circuit opens
};

async function redisOperation(redisHelper: RedisHelper, cacheKey: string) {
	//Testing:
	//throw new Error(`Redis error: ${cacheKey}`);
	//return 'test';
	const cacheValueResult = await redisHelper.get(cacheKey);
	if (cacheValueResult.isErr()) {
		throw new Error(`Redis error: ${cacheValueResult.error.message}`);
	}
	return cacheValueResult.value;
}

export const redisCacheCircuitBreaker = new CircuitBreaker(redisOperation, circuitBreakerOptions);

@Service()
export class RedisHelper {
	//private client: RedisClientType;
	private client?: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
	private isConnected: boolean = false;

	async init(isLocal: boolean = false) {
		if (isLocal) {
			logger.info(`$Host:${REDIS_HOST}:Port:${REDIS_PORT}`);

			this.client = await createClient()
				.on('error', (err) => {
					this.isConnected = false;
					console.log('Redis Client Error', err);
					logger.error(`Redis Client Error: ${err}`);
				})
				.on('ready', () => {
					this.isConnected = true;
					console.log('Redis Client Ready');
					logger.info('Redis Client Ready');
				})
				.on('end', () => {
					this.isConnected = false;
					console.log('Redis Client End');
					logger.info('Redis Client End');
				})
				.connect();
		} else {
			const url: string = `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`;

			this.client = await createClient({
				url: url,
			})
				.on('error', (err) => {
					this.isConnected = false;
					console.log('Redis Client Error', err);
					logger.error(`Redis Client Error: ${err}`);
				})
				.on('ready', () => {
					this.isConnected = true;
					console.log('Redis Client Ready');
					logger.info('Redis Client Ready');
				})
				.on('end', () => {
					this.isConnected = false;
					console.log('Redis Client End');
					logger.info('Redis Client End');
				})
				.connect();
		}
	}

	async get(key: string): Promise<Result<string | null | undefined, ResultError>> {
		if (!this.isConnected)
			return ResultFactory.error(
				StatusCodes.SERVICE_UNAVAILABLE,
				'Redis Client Not Connected'
			);

		if (!key) return ResultFactory.error(StatusCodes.BAD_REQUEST, 'Key is required');
		const data = await this.client?.get(key);
		return new Ok(data);
	}

	async set(key: string, value: string): Promise<Result<undefined, ResultError>> {
		if (!this.isConnected)
			return ResultFactory.error(
				StatusCodes.SERVICE_UNAVAILABLE,
				'Redis Client Not Connected'
			);
		if (!key) return ResultFactory.error(StatusCodes.BAD_REQUEST, 'Key is required');
		if (!value) return ResultFactory.error(StatusCodes.BAD_REQUEST, 'Value is required');

		await this.client?.set(key, value);
		return new Ok(undefined);
	}

	async disconnect(): Promise<void> {
		if (this.isConnected) {
			await this.client?.disconnect();
			this.isConnected = false;
		}
	}
}

export const getIORedisConnection = (): ConnectionOptions => {
	const env = process.env.NODE_ENV;
	const isLocal = env == 'development';

	let connectionOptions: ConnectionOptions;

	if (isLocal) {
		connectionOptions = {
			host: REDIS_HOST,
			port: parseInt(REDIS_PORT!),
		};
	} else {
		connectionOptions = {
			host: REDIS_HOST,
			port: parseInt(REDIS_PORT!),
			username: REDIS_USERNAME,
			password: REDIS_PASSWORD,
		};
	}

	return connectionOptions;
};

// #region Redis Wrapper

export interface IRedisStoreWrapperParameters<TParams> {
	key: string;
	env: 'production' | 'dev';
	setParams: TParams;
}

export type RowVersionNumber = number;

export interface IRedisStoreWrapper<TParams extends object, TResult extends object>
	extends IServiceHandlerAsync<IRedisStoreWrapperParameters<TParams>, TResult> {}

export abstract class RedisStoreWrapper<TParams extends object, TResult extends object>
	implements IRedisStoreWrapper<TParams, TResult>
{
	private readonly _redisHelper: RedisHelper;
	private readonly _logger: winston.Logger;

	public constructor(redisHelper: RedisHelper, logger: winston.Logger) {
		this._redisHelper = redisHelper;
		this._logger = logger;
	}

	private async setCacheAsync(
		key: string,
		params: TParams
	): Promise<Result<TResult, ResultError>> {
		let result: TResult;
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			// Check if setCacheDataAsync function implement or not
			if (!this.setCacheDataAsync)
				return ResultFactory.error(
					StatusCodes.NOT_IMPLEMENTED,
					`setCacheDataAsync is not implemented`
				);

			// Call setCacheDataAsync function to get data for storing cache
			const setCacheResult = await this.setCacheDataAsync(params);
			if (setCacheResult.isErr())
				return ResultFactory.error(
					setCacheResult.error.statusCode,
					setCacheResult.error.message
				);

			const data = setCacheResult.value as TResult;
			if (!data) return ResultFactory.error(StatusCodes.NOT_FOUND, `data is not found`);

			result = data as TResult;

			this._logger.info(
				`RedisStoreWrapper: Redis data found from setCacheDataAsync function`
			);

			// Set Cache
			const setRedisCacheResult = await this._redisHelper.set(
				key,
				JSON.stringify(result as TResult)
			);
			if (setRedisCacheResult.isErr()) {
				this._logger.error(
					`RedisStoreWrapperError setting cache value for key: ${key}`,
					setRedisCacheResult.error
				);
				return ResultFactory.success(result as TResult);
			}
			return ResultFactory.success(result as TResult);
		});
	}

	public async handleAsync(
		params: IRedisStoreWrapperParameters<TParams>
	): Promise<Result<TResult, ResultError>> {
		let result: TResult;

		try {
			// Guard
			if (!params) return ResultFactory.error(StatusCodes.BAD_REQUEST, `params are required`);

			if (!params.key) return ResultFactory.error(StatusCodes.BAD_REQUEST, `key is required`);

			if (!this._redisHelper)
				return ResultFactory.error(
					StatusCodes.BAD_REQUEST,
					`redis helper object is not initiated`
				);

			if (!this._logger)
				return ResultFactory.error(
					StatusCodes.BAD_REQUEST,
					`logger object is not initiated`
				);

			const { env, key, setParams } = params;

			// init Redis Cache
			await this._redisHelper.init(env === 'dev' ? true : false);
			const cacheValueResult = await redisCacheCircuitBreaker.fire(this._redisHelper, key);
			this._logger.info(`RedisStoreWrapper: Redis init`);

			// Get Cache Value
			const cacheValue: string = cacheValueResult!;

			if (!cacheValue) {
				this._logger.info(`RedisStoreWrapper: Redis Cache value not found`);

				// Set Cache
				const setCacheResult = await this.setCacheAsync(key, setParams);
				if (setCacheResult.isErr())
					return ResultFactory.errorInstance(setCacheResult.error);

				result = setCacheResult.value as TResult;

				return ResultFactory.success(result as TResult);
			} else {
				// Get Cache value
				result = JSON.parse(cacheValue);
				if (!result)
					return ResultFactory.error(StatusCodes.NOT_FOUND, `cache data is not found`);

				// Check if result has `version` property
				if ('version' in result === false)
					return ResultFactory.error(
						StatusCodes.NOT_FOUND,
						`version property is not found`
					);

				this._logger.info(`RedisStoreWrapper: Redis Cache value found`);

				// Call setRowVersionAsync function
				if (!this.setRowVersionAsync)
					return ResultFactory.error(
						StatusCodes.NOT_IMPLEMENTED,
						`setRowVersionAsync is not implemented`
					);

				const setRowVersionResult = await this.setRowVersionAsync(setParams);
				if (setRowVersionResult.isErr())
					return ResultFactory.error(
						setRowVersionResult.error.statusCode,
						setRowVersionResult.error.message
					);

				const rowVersion: RowVersionNumber =
					setRowVersionResult.value as number as RowVersionNumber;
				if (!rowVersion)
					return ResultFactory.error(StatusCodes.NOT_FOUND, `No version number found`);

				if (result.version !== rowVersion) {
					// Set Cache
					const setCacheResult = await this.setCacheAsync(key, setParams);
					if (setCacheResult.isErr())
						return ResultFactory.errorInstance(setCacheResult.error);

					result = setCacheResult.value as TResult;

					return ResultFactory.success(result as TResult);
				}

				return ResultFactory.success(result as TResult);
			}
		} catch (ex) {
			const error = ex as Error;
			if (!this.setCacheDataAsync)
				return ResultFactory.error(
					StatusCodes.NOT_IMPLEMENTED,
					`setCacheDataAsync is not implemented`
				);

			// Call setCacheDataAsync function to get data for storing cache
			const setCacheResult = await this.setCacheDataAsync(params.setParams);
			if (setCacheResult.isErr())
				return ResultFactory.error(
					setCacheResult.error.statusCode,
					setCacheResult.error.message
				);

			const data = setCacheResult.value as TResult;
			if (!data) return ResultFactory.error(StatusCodes.NOT_FOUND, `data is not found`);

			result = data as TResult;
			return ResultFactory.error(
				StatusCodes.INTERNAL_SERVER_ERROR,
				error.message,
				result, // FallBack Result
				error.stack
			);
		}
	}

	protected abstract setCacheDataAsync(params: TParams): Promise<Result<TResult, ResultError>>;

	protected abstract setRowVersionAsync(
		params: TParams
	): Promise<Result<RowVersionNumber, ResultError>>;
}
// #endregion
