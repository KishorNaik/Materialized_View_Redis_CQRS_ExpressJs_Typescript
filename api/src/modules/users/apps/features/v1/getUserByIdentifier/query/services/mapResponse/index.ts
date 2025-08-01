import { UserEntity } from '@kishornaik/db';
import {
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
} from '@kishornaik/utils';
import { GetUserByIdentifierResponseDto } from '../../../contracts';

export interface IGetUserByIdentifierResponseMapService
	extends IServiceHandlerAsync<UserEntity, GetUserByIdentifierResponseDto> {}

@sealed
@Service()
export class GetUserByIdentifierResponseMapService
	implements IGetUserByIdentifierResponseMapService
{
	public handleAsync(
		params: UserEntity
	): Promise<Result<GetUserByIdentifierResponseDto, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			// Guard
			const guardResult = new GuardWrapper().check(params, 'params').validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Map
			const responseDto = new GetUserByIdentifierResponseDto();
			responseDto.identifier = params.identifier;
			responseDto.clientId = params.clientId;
			responseDto.firstName = params.firstName;
			responseDto.lastName = params.lastName;
			responseDto.userName = params.userCredentials.userName;
			((responseDto.communication = {
				identifier: params.userCommunication.identifier,
				email: params.userCommunication.email,
				mobileNo: params.userCommunication.mobileNo,
			}),
				(responseDto.settings = {
					identifier: params.userSettings.identifier,
					isEmailVerified: params.userSettings.isEmailVerified,
					isVerificationEmailSent: params.userSettings.isVerificationEmailSent,
					isWelcomeEmailSent: params.userSettings.isWelcomeEmailSent,
				}));
			return ResultFactory.success(responseDto);
		});
	}
}
