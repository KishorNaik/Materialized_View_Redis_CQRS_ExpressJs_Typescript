import {
	RequestData,
	sealed,
	StatusCodes,
	DataResponse,
	requestHandler,
	RequestHandler,
	DataResponseFactory,
	PipelineWorkflowException,
	PipelineWorkflow,
	Container,
	TransactionsWrapper,
	GuardWrapper,
	ResultFactory,
	ExceptionsWrapper,
	AesResponseDto,
	IAesEncryptResult,
	StatusEnum,
	CleanUpWrapper,
} from '@kishornaik/utils';
import { GetUserByIdentifierRequestDto, GetUserByIdentifierResponseDto } from '../contracts';
import { logger } from '@/shared/utils/helpers/loggers';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { GetUserByIdentifierEncryptResponseService } from './services/encryptResponse';
import { ENCRYPTION_KEY, NODE_ENV } from '@/config/env';
import { getQueryRunner, UserEntity } from '@kishornaik/db';
import { GetUserByIdentifierResponseMapService } from './services/mapResponse';
import { GetUserByIdentifierValidationService } from './services/validations';
import { GetUserByIdentifierMapEntityService } from './services/mapEntity';
import { SetUserByIdentifierCacheService } from '@/modules/users/shared/cache/set/services/byIdentifier';

// #region Query
@sealed
export class GetUserByIdentifierQuery extends RequestData<DataResponse<AesResponseDto>> {
	private readonly _request: GetUserByIdentifierRequestDto;
	public constructor(request: GetUserByIdentifierRequestDto) {
		super();
		this._request = request;
	}

	public get request(): GetUserByIdentifierRequestDto {
		return this._request;
	}
}

//#endregion

enum pipelineSteps {
	ValidationService = 'ValidationService',
	MapEntityService = 'MapEntityService',
	CacheService = 'CacheService',
	MapResponseService = 'MapResponseService',
	EncryptResponseService = 'EncryptResponseService',
}

// #region Query Handler
@sealed
@requestHandler(GetUserByIdentifierQuery)
export class GetUserByIdentifierQueryHandler
	implements RequestHandler<GetUserByIdentifierQuery, DataResponse<AesResponseDto>>
{
	private pipeline = new PipelineWorkflow(logger);
	private readonly _getUserValidationService: GetUserByIdentifierValidationService;
	private readonly _getUserByIdentifierMapEntityService: GetUserByIdentifierMapEntityService;
	private readonly _getUserByIdentifierCacheService: SetUserByIdentifierCacheService;
	private readonly _getUserByIdentifierEncryptResponseService: GetUserByIdentifierEncryptResponseService;
	private readonly _getUserByIdentifierResponseMapService: GetUserByIdentifierResponseMapService;

	public constructor() {
		this._getUserValidationService = Container.get(GetUserByIdentifierValidationService);
		this._getUserByIdentifierMapEntityService = Container.get(
			GetUserByIdentifierMapEntityService
		);
		this._getUserByIdentifierEncryptResponseService = Container.get(
			GetUserByIdentifierEncryptResponseService
		);
		this._getUserByIdentifierCacheService = Container.get(SetUserByIdentifierCacheService);
		this._getUserByIdentifierResponseMapService = Container.get(
			GetUserByIdentifierResponseMapService
		);
	}

	public async handle(value: GetUserByIdentifierQuery): Promise<DataResponse<AesResponseDto>> {
		const queryRunner = getQueryRunner();
		await queryRunner.connect();

		const response = await TransactionsWrapper.runDataResponseAsync({
			queryRunner: queryRunner,
			onTransaction: async () => {
				const { request } = value;

				// Guard
				const guardResult = new GuardWrapper()
					.check(value, 'value')
					.check(request, 'request')
					.validate();
				if (guardResult.isErr())
					return DataResponseFactory.error<AesResponseDto>(
						guardResult.error.statusCode,
						guardResult.error.message
					);

				// Validation Service
				await this.pipeline.step(pipelineSteps.ValidationService, async () => {
					return await this._getUserValidationService.handleAsync({
						dto: request,
						dtoClass: GetUserByIdentifierRequestDto,
					});
				});

				// Map Entity
				await this.pipeline.step(pipelineSteps.MapEntityService, async () => {
					return await this._getUserByIdentifierMapEntityService.handleAsync({
						identifier: request.id,
						status: StatusEnum.ACTIVE,
					});
				});

				// User Cache Service
				await this.pipeline.step(pipelineSteps.CacheService, async () => {
					// Get Map Entity Result
					const userMapResult = this.pipeline.getResult<UserEntity>(
						pipelineSteps.MapEntityService
					);

					const cacheResult = await this._getUserByIdentifierCacheService.handleAsync({
						env: NODE_ENV!,
						key: `user-${userMapResult.identifier}`,
						setParams: {
							queryRunner: queryRunner,
							user: {
								identifier: userMapResult.identifier,
								status: userMapResult.status,
							},
						},
					});

					if (cacheResult.isErr()) {
						if (cacheResult.error.fallbackObject)
							return ResultFactory.success<UserEntity>(
								cacheResult.error.fallbackObject as UserEntity
							);
						return ResultFactory.error<UserEntity>(
							cacheResult.error.statusCode,
							cacheResult.error.message
						);
					}
					return ResultFactory.success<UserEntity>(cacheResult.value);
				});

				// Map Response
				await this.pipeline.step(pipelineSteps.MapResponseService, async () => {
					const userEntityResult = await this.pipeline.getResult<UserEntity>(
						pipelineSteps.CacheService
					);
					return await this._getUserByIdentifierResponseMapService.handleAsync(
						userEntityResult
					);
				});

				// Encrypt Response
				await this.pipeline.step(pipelineSteps.EncryptResponseService, async () => {
					const userEntityResult = await this.pipeline.getResult<UserEntity>(
						pipelineSteps.CacheService
					);
					const getIdentifierByResponseDtoResult =
						await this.pipeline.getResult<GetUserByIdentifierResponseDto>(
							pipelineSteps.MapResponseService
						);

					return await this._getUserByIdentifierEncryptResponseService.handleAsync({
						data: getIdentifierByResponseDtoResult,
						key: userEntityResult.userKeys.aesSecretKey,
					});
				});

				// Return Response
				const response = this.pipeline.getResult<IAesEncryptResult>(
					pipelineSteps.EncryptResponseService
				);
				return DataResponseFactory.success<AesResponseDto>(
					StatusCodes.OK,
					response.aesResponseDto
				);
			},
		});

		CleanUpWrapper.run(() => {
			this.pipeline = null;
		});

		return response;
	}
}

// #endregion
