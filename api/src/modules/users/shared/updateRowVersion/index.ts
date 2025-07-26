import {
	Container,
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerVoidAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusEnum,
	VOID_RESULT,
	VoidResult,
} from '@kishornaik/utils';
import { QueryRunner, UpdateUserVersionDbService, UserEntity } from '@kishornaik/db';

export interface IUpdateUserRowVersionServiceParameters {
	userId: string;
	status: StatusEnum;
	queryRunner: QueryRunner;
}

export interface IUpdateUserRowVersionService
	extends IServiceHandlerVoidAsync<IUpdateUserRowVersionServiceParameters> {}

Container.set<UpdateUserVersionDbService>(
	UpdateUserVersionDbService,
	new UpdateUserVersionDbService()
);

@sealed
@Service()
export class UpdateUserRowVersionService implements IUpdateUserRowVersionService {
	private readonly _updateUserRowVersionService: UpdateUserVersionDbService;

	public constructor() {
		this._updateUserRowVersionService = Container.get(UpdateUserVersionDbService);
	}

	public handleAsync(
		params: IUpdateUserRowVersionServiceParameters
	): Promise<Result<VoidResult, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { queryRunner, status, userId } = params;
			// Guard
			const guardResult = new GuardWrapper()
				.check(params, 'params')
				.check(userId, 'userId')
				.check(status, 'status')
				.check(queryRunner, 'queryRunner')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			//Map Entity
			const userEntity: UserEntity = new UserEntity();
			userEntity.identifier = userId;
			userEntity.status = status;
			userEntity.modified_date = new Date();
			// Update Row Version
			const updateResult = await this._updateUserRowVersionService.handleAsync(
				userEntity,
				queryRunner
			);
			if (updateResult.isErr())
				return ResultFactory.error(
					updateResult.error.statusCode,
					updateResult.error.message
				);

			return ResultFactory.success(VOID_RESULT);
		});
	}
}
