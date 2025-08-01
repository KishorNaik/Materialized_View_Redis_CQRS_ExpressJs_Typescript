import { logger } from '@/shared/utils/helpers/loggers';
import { GetUserRowVersionDbService, QueryRunner, UserEntity } from '@kishornaik/db';
import {
	Container,
	ExceptionsWrapper,
	GuardWrapper,
	RedisHelper,
	RedisStoreWrapper,
	Result,
	ResultError,
	ResultFactory,
	RowVersionNumber,
	sealed,
	Service,
	StatusEnum,
} from '@kishornaik/utils';

Container.set<GetUserRowVersionDbService>(
	GetUserRowVersionDbService,
	new GetUserRowVersionDbService()
);

export interface ISetUserByClientIdCacheServiceParameters {
	queryRunner: QueryRunner;
	user: {
		identifier: string;
		status: StatusEnum;
	};
	userData: UserEntity;
}

@sealed
@Service()
export class SetUserByClientIdCacheService extends RedisStoreWrapper<
	ISetUserByClientIdCacheServiceParameters,
	UserEntity
> {
	private readonly _getUserRowVersionDbService: GetUserRowVersionDbService;

	public constructor() {
		const redisHelper = new RedisHelper();
		super(redisHelper, logger);
		this._getUserRowVersionDbService = Container.get(GetUserRowVersionDbService);
	}

	protected async setCacheDataAsync(
		params: ISetUserByClientIdCacheServiceParameters
	): Promise<Result<UserEntity, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { userData } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(params, 'params')
				.check(userData, 'userData')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			return ResultFactory.success(userData);
		});
	}
	protected async getRowVersionAsync(
		params: ISetUserByClientIdCacheServiceParameters
	): Promise<Result<RowVersionNumber, ResultError>> {
		return await ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { queryRunner, user } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(params, 'params')
				.check(user, 'user')
				.check(queryRunner, 'queryRunner')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Map
			const userEntity = new UserEntity();
			userEntity.identifier = user.identifier;
			userEntity.status = user.status;

			const rowVersionResult = await this._getUserRowVersionDbService.handleAsync(
				userEntity,
				queryRunner
			);
			if (rowVersionResult.isErr())
				return ResultFactory.error(
					rowVersionResult.error.statusCode,
					rowVersionResult.error.message
				);

			return ResultFactory.success(rowVersionResult.value.version as RowVersionNumber);
		});
	}
}
