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
	AesResponseDto,
	AesRequestDto,
	TransactionsWrapper,
	defineParallelSteps,
	defineParallelStep,
	GuardWrapper,
	IAesEncryptResult,
	FireAndForgetWrapper,
	ResultFactory,
} from '@kishornaik/utils';
import { getTraceId, logger } from '@/shared/utils/helpers/loggers';
import { AddOutboxDbService, getQueryRunner } from '@kishornaik/db';
import { CreateUserDecryptService } from './services/decrypt';
import { ENCRYPTION_KEY } from '../../../../../../../config/env';
import { CreateUserRequestValidationService } from './services/validations';
import { CreateUserRequestDto, CreateUserResponseDto } from '../contracts';
import { CreateUserHashPasswordService } from './services/hashPassword';
import { CreateUserKeysService, ICreateUserKeysServiceResult } from './services/keys';
import {
	CreateUserMapEntityService,
	ICreateUserMapEntityServiceResult,
} from './services/mapEntity';
import { IHashPasswordResult } from '@/shared/services/users/user.HashPassword.Service';
import { CreateUserMapResponseService } from './services/mapResponse';
import { CreateUserEncryptResponseService } from './services/encrypt';
import { CreateUserDbService } from './services/db/createUsers';
import { CreateOutboxDbService } from './services/db/createOutbox';

// #region Command
@sealed
export class CreateUserCommand extends RequestData<DataResponse<AesResponseDto>> {
	private readonly _request: AesRequestDto;

	public constructor(request: AesRequestDto) {
		super();
		this._request = request;
	}

	public get request(): AesRequestDto {
		return this._request;
	}
}

// #endregion

// #region Pipeline Steps
enum pipelineSteps {
	DecryptService = 'DecryptService',
	ValidationService = 'ValidationService',
	HashPasswordService = 'HashPasswordService',
	GenerateKeysService = 'GenerateKeysService',
	MapEntityService = 'MapEntityService',
	DbService = 'DbService',
	MapResponseService = 'MapResponseService',
	EncryptService = 'EncryptService',
	AddOutBoxDbService = 'AddOutBoxDbService',
}
// #endregion

// #region Command Handlers
@sealed
@requestHandler(CreateUserCommand)
export class CreateUserCommandHandler
	implements RequestHandler<CreateUserCommand, DataResponse<AesResponseDto>>
{
	private pipeline = new PipelineWorkflow(logger);
	private readonly _createUserDecryptService: CreateUserDecryptService;
	private readonly _createUserRequestValidationService: CreateUserRequestValidationService;
	private readonly _createUserHashPasswordService: CreateUserHashPasswordService;
	private readonly _createUserGenerateKeysService: CreateUserKeysService;
	private readonly _createUserMapEntityService: CreateUserMapEntityService;
	private readonly _createUserDbService: CreateUserDbService;
	private readonly _createUserMapResponseService: CreateUserMapResponseService;
	private readonly _createUserEncryptService: CreateUserEncryptResponseService;
	private readonly _createOutboxDbService: CreateOutboxDbService;

	public constructor() {
		this._createUserDecryptService = Container.get(CreateUserDecryptService);
		this._createUserRequestValidationService = Container.get(
			CreateUserRequestValidationService
		);
		this._createUserHashPasswordService = Container.get(CreateUserHashPasswordService);
		this._createUserGenerateKeysService = Container.get(CreateUserKeysService);
		this._createUserMapEntityService = Container.get(CreateUserMapEntityService);
		this._createUserDbService = Container.get(CreateUserDbService);
		this._createUserMapResponseService = Container.get(CreateUserMapResponseService);
		this._createUserEncryptService = Container.get(CreateUserEncryptResponseService);
		this._createOutboxDbService = Container.get(CreateOutboxDbService);
	}

	public async handle(value: CreateUserCommand): Promise<DataResponse<AesResponseDto>> {
		const queryRunner = getQueryRunner();
		await queryRunner.connect();

		return await TransactionsWrapper.runDataResponseAsync({
			queryRunner: queryRunner,
			onTransaction: async () => {
				const { request } = value;

				// Guard
				const guardResult = new GuardWrapper()
					.check(value, 'value')
					.check(request, 'request')
					.validate();
				if (guardResult.isErr())
					return DataResponseFactory.error(
						guardResult.error.statusCode,
						guardResult.error.message
					);

				// Decrypt Service
				await this.pipeline.step(pipelineSteps.DecryptService, async () => {
					return this._createUserDecryptService.handleAsync({
						data: request.body,
						key: ENCRYPTION_KEY,
					});
				});

				// Validation Service
				await this.pipeline.step(pipelineSteps.ValidationService, async () => {
					const requestResult = this.pipeline.getResult<CreateUserRequestDto>(
						pipelineSteps.DecryptService
					);
					return this._createUserRequestValidationService.handleAsync({
						dto: requestResult,
						dtoClass: CreateUserRequestDto,
					});
				});

				// Hash Password Service + Generate Keys Service
				await this.pipeline.stepParallel(
					defineParallelSteps(
						defineParallelStep(pipelineSteps.HashPasswordService, async () => {
							const requestResult = this.pipeline.getResult<CreateUserRequestDto>(
								pipelineSteps.DecryptService
							);
							const password = requestResult.password;
							return await this._createUserHashPasswordService.handleAsync({
								password: password,
							});
						}),
						defineParallelStep(pipelineSteps.GenerateKeysService, async () => {
							return await this._createUserGenerateKeysService.handleAsync();
						})
					)
				);

				// Map Entity Service
				await this.pipeline.step(pipelineSteps.MapEntityService, async () => {
					const requestResult = this.pipeline.getResult<CreateUserRequestDto>(
						pipelineSteps.DecryptService
					);
					const keysResult = this.pipeline.getResult<ICreateUserKeysServiceResult>(
						pipelineSteps.GenerateKeysService
					);
					const hashPasswordResult = this.pipeline.getResult<IHashPasswordResult>(
						pipelineSteps.HashPasswordService
					);
					return await this._createUserMapEntityService.handleAsync({
						request: requestResult,
						keys: keysResult,
						hashPassword: hashPasswordResult,
					});
				});

				// Db Service
				await this.pipeline.step(pipelineSteps.DbService, async () => {
					const entityResult = this.pipeline.getResult<ICreateUserMapEntityServiceResult>(
						pipelineSteps.MapEntityService
					);
					const dbResult = await this._createUserDbService.handleAsync({
						entity: entityResult,
						queryRunner: queryRunner,
					});
					if (dbResult.isErr()) {
						if (
							dbResult.error.message.includes(
								'duplicate key value violates unique constraint'
							)
						) {
							return ResultFactory.error(StatusCodes.CONFLICT, 'User already exists');
						}
						return ResultFactory.error(
							dbResult.error.statusCode,
							dbResult.error.message
						);
					}
					return ResultFactory.success(dbResult.value);
				});

				// Add OutBox
				await this.pipeline.step(pipelineSteps.AddOutBoxDbService, async () => {
					const entityResult = this.pipeline.getResult<ICreateUserMapEntityServiceResult>(
						pipelineSteps.MapEntityService
					);
					return await this._createOutboxDbService.handleAsync({
						entity: entityResult,
						queryRunner: queryRunner,
						traceId: getTraceId(),
					});
				});

				// Map Response Service
				await this.pipeline.step(pipelineSteps.MapResponseService, async () => {
					const entityResult = this.pipeline.getResult<ICreateUserMapEntityServiceResult>(
						pipelineSteps.MapEntityService
					);
					const users = entityResult.entity.users;
					return await this._createUserMapResponseService.handleAsync(users);
				});

				// Encrypt Service
				await this.pipeline.step(pipelineSteps.EncryptService, async () => {
					const responseMapResult = this.pipeline.getResult<CreateUserResponseDto>(
						pipelineSteps.MapResponseService
					);
					return await this._createUserEncryptService.handleAsync({
						data: responseMapResult,
						key: ENCRYPTION_KEY,
					});
				});

				// Get Encrypted Response
				const encryptedResponse = this.pipeline.getResult<IAesEncryptResult>(
					pipelineSteps.EncryptService
				);
				const aesResponseDto = encryptedResponse.aesResponseDto;

				return DataResponseFactory.success(
					StatusCodes.CREATED,
					aesResponseDto,
					'User created successfully'
				);
			},
		});
	}
}
// #endregion
