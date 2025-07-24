import {
	Container,
	DtoValidation,
	IDtoValidation,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusCodes,
	ExceptionsWrapper,
	GuardWrapper,
} from '@kishornaik/utils';
import { dbDataSource, QueryRunner } from '../../../../../../config/dbSource';
import { UserEntity } from '../../../../../app.Module';

export interface IGetUserByIdentifierDbServiceParameters {
	userEntity: UserEntity | undefined;
	queryRunner: QueryRunner | undefined;
}

export interface IGetUserByIdentifierDbService
	extends IServiceHandlerAsync<IGetUserByIdentifierDbServiceParameters, UserEntity> {}

@sealed
@Service()
export class GetUserByIdentifierDbService implements IGetUserByIdentifierDbService {
	private readonly dtoValidation: IDtoValidation<UserEntity>;

	public constructor() {
		this.dtoValidation = Container.get(DtoValidation<UserEntity>);
	}

	public handleAsync(
		params: IGetUserByIdentifierDbServiceParameters
	): Promise<Result<UserEntity, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { userEntity, queryRunner } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(params)
				.check(userEntity, 'userEntity')
				.check(queryRunner, 'queryRunner')
				.validate();

			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Validation
			const validationResult = await this.dtoValidation.handleAsync({
				dto: userEntity!,
				dtoClass: UserEntity,
			});
			if (validationResult.isErr())
				return ResultFactory.errorInstance(validationResult.error);

			// Manager
			const entityManager = queryRunner ? queryRunner.manager : dbDataSource.manager;

			// Join Query
			const results = await entityManager
				.createQueryBuilder(UserEntity, `user`)
				.innerJoinAndSelect(`user.userCommunication`, `userCommunication`)
				.innerJoinAndSelect(`user.userKeys`, `userKeys`)
				.innerJoinAndSelect(`user.userSettings`, `userSettings`)
				.innerJoinAndSelect(`user.userCredentials`, `userCredentials`)
				.where(`user.identifier=:identifier`, {
					identifier: userEntity?.identifier,
				})
				.andWhere(`user.status=:status`, {
					status: userEntity?.status,
				})
				.getOne();

			if (!results) return ResultFactory.error(StatusCodes.NOT_FOUND, `user not found`);

			// Return
			return ResultFactory.success(results);
		});
	}
}
