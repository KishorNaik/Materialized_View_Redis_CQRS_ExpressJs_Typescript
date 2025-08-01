import {
	Container,
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerVoidAsync,
	PipelineWorkflow,
	Result,
	ResultError,
	ResultFactory,
	Service,
	StatusEnum,
	VOID_RESULT,
	VoidResult,
	sealed,
} from '@kishornaik/utils';
import { QueryRunner, UserEntity } from '@kishornaik/db';
import { logger } from '@/shared/utils/helpers/loggers';
import { SetUserByIdentifierCacheService } from './services/byIdentifier';
import { NODE_ENV } from '@/config/env';
import { SetUserByClientIdCacheService } from './services/byClientId';
export interface IUserSharedCacheServiceParameters {
	queryRunner: QueryRunner;
	user: {
		identifier: string;
		status: StatusEnum;
	};
}

export interface IUserSharedCacheService
	extends IServiceHandlerVoidAsync<IUserSharedCacheServiceParameters> {}

enum pipelineSteps {
	byIdentifier = 'ByIdentifier',
	byClientId = 'ByClientId',
}

@sealed
@Service()
export class UserSharedCacheService implements IUserSharedCacheService {
	private pipeline = new PipelineWorkflow(logger);
	private readonly _setUserByIdentifierCacheService: SetUserByIdentifierCacheService;
	private readonly _setSetUserByClientIdCacheService: SetUserByClientIdCacheService;

	public constructor() {
		this._setUserByIdentifierCacheService = Container.get(SetUserByIdentifierCacheService);
		this._setSetUserByClientIdCacheService = Container.get(SetUserByClientIdCacheService);
	}

	public handleAsync(
		params: IUserSharedCacheServiceParameters
	): Promise<Result<VoidResult, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { queryRunner, user } = params;
			const { identifier, status } = user;

			// Guard
			const guardResult = new GuardWrapper()
				.check(params, 'params')
				.check(user, 'user')
				.check(queryRunner, 'queryRunner')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// By Identifier
			await this.pipeline.step(pipelineSteps.byIdentifier, async () => {
				return await this._setUserByIdentifierCacheService.handleAsync({
					env: NODE_ENV!,
					key: `user-${identifier}`,
					setParams: {
						queryRunner: queryRunner,
						user: {
							identifier: identifier,
							status: status,
						},
					},
				});
			});

			// By Client Id
			await this.pipeline.step(pipelineSteps.byClientId, async () => {
				const userEntity: UserEntity = this.pipeline.getResult<UserEntity>(
					pipelineSteps.byIdentifier
				);
				const clientId = userEntity.clientId;
				const key = `user-client-${clientId}`;
				return await this._setSetUserByClientIdCacheService.handleAsync({
					env: NODE_ENV!,
					key: key,
					setParams: {
						queryRunner: queryRunner,
						user: {
							identifier: identifier,
							status: status,
						},
						userData: userEntity,
					},
				});
			});

			return ResultFactory.success(VOID_RESULT);
		});
	}
}
