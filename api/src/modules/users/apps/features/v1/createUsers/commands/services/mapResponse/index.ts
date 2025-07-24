import { UserEntity } from '@kishornaik/db';
import {
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	Service,
	sealed,
} from '@kishornaik/utils';
import { CreateUserResponseDto } from '../../../contracts';

export interface ICreateUserMapResponseService
	extends IServiceHandlerAsync<UserEntity, CreateUserResponseDto> {}

@sealed
@Service()
export class CreateUserMapResponseService implements ICreateUserMapResponseService {
	public handleAsync(params: UserEntity): Promise<Result<CreateUserResponseDto, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			// Guard
			const guardResult = new GuardWrapper().check(params, 'params').validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			const { identifier, clientId } = params;

			// Map Response
			const responseDto = new CreateUserResponseDto();
			responseDto.identifier = identifier;
			responseDto.clientId = clientId;

			return ResultFactory.success(responseDto);
		});
	}
}
