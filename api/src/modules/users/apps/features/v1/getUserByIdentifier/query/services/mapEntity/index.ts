import {
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusCodes,
	StatusEnum,
} from '@kishornaik/utils';
import { GetUserByIdentifierRequestDto } from '../../../contracts';
import { UserEntity } from '@kishornaik/db';

export interface IGetGetUserByIdentifierMapEntityServiceParameters {
	identifier: string;
	status: StatusEnum;
}

export interface IGetGetUserByIdentifierMapEntityService
	extends IServiceHandlerAsync<IGetGetUserByIdentifierMapEntityServiceParameters, UserEntity> {}

@sealed
@Service()
export class GetUserByIdentifierMapEntityService
	implements IGetGetUserByIdentifierMapEntityService
{
	public handleAsync(
		params: IGetGetUserByIdentifierMapEntityServiceParameters
	): Promise<Result<UserEntity, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { identifier, status } = params;

			// Gard
			const guardResult = new GuardWrapper()
				.check(params, 'params')
				.check(identifier, `identifier`)
				.check(status, `status`)
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			//  Map
			const userEntity = new UserEntity();
			userEntity.identifier = identifier;
			userEntity.status = status;

			return ResultFactory.success(userEntity);
		});
	}
}
