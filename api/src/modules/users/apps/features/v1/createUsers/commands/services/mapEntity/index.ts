import {
	BoolEnum,
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusEnum,
} from '@kishornaik/utils';
import { CreateUserRequestDto } from '../../../contracts';
import { ICreateUserKeysServiceResult } from '../keys';
import { IHashPasswordResult } from '@/shared/services/users/user.HashPassword.Service';
import {
	UserCommunicationEntity,
	UserCredentialsEntity,
	UserEntity,
	UserKeysEntity,
	UsersSettingsEntity,
} from '@kishornaik/db';
import { randomUUID } from 'crypto';

export interface ICreateUserMapEntityServiceParameters {
	request: CreateUserRequestDto;
	keys: ICreateUserKeysServiceResult;
	hashPassword: IHashPasswordResult;
}

export interface ICreateUserMapEntityServiceResult {
	entity: {
		users: UserEntity;
		communications: UserCommunicationEntity;
		keys: UserKeysEntity;
		settings: UsersSettingsEntity;
		credentials: UserCredentialsEntity;
	};
}

export interface ICreateUserMapEntityService
	extends IServiceHandlerAsync<
		ICreateUserMapEntityServiceParameters,
		ICreateUserMapEntityServiceResult
	> {}

@sealed
@Service()
export class CreateUserMapEntityService implements ICreateUserMapEntityService {
	public handleAsync(
		params: ICreateUserMapEntityServiceParameters
	): Promise<Result<ICreateUserMapEntityServiceResult, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { request, keys, hashPassword } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(request, 'request')
				.check(keys, 'keys')
				.check(hashPassword, 'hashPassword')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Map Entity
			const userEntity = new UserEntity();
			userEntity.identifier = randomUUID().toString();
			userEntity.clientId = randomUUID().toString();
			userEntity.firstName = request.firstName;
			userEntity.lastName = request.lastName;
			userEntity.status = StatusEnum.ACTIVE;

			const userCommunicationEntity = new UserCommunicationEntity();
			userCommunicationEntity.identifier = randomUUID().toString();
			userCommunicationEntity.status = StatusEnum.ACTIVE;
			userCommunicationEntity.email = request.email;
			userCommunicationEntity.mobileNo = request.mobileNo;
			userCommunicationEntity.userId = userEntity.identifier;

			const userKeysEntity = new UserKeysEntity();
			userKeysEntity.identifier = randomUUID().toString();
			userKeysEntity.status = StatusEnum.ACTIVE;
			userKeysEntity.aesSecretKey = keys.aesSecretKey;
			userKeysEntity.hmacSecretKey = keys.hmacSecretKey;
			userKeysEntity.userId = userEntity.identifier;
			userKeysEntity.refreshToken = null;
			userKeysEntity.refreshTokenExpiresAt = null;

			const userSettingsEntity = new UsersSettingsEntity();
			userSettingsEntity.identifier = randomUUID().toString();
			userSettingsEntity.emailVerificationToken = randomUUID().toString();
			userSettingsEntity.emailVerificationTokenExpiresAt = new Date(
				new Date().getTime() + 24 * 60 * 60 * 1000
			);
			userSettingsEntity.isEmailVerified = BoolEnum.NO;
			userSettingsEntity.status = StatusEnum.ACTIVE;
			userSettingsEntity.userId = userEntity.identifier;

			const userCredentialsEntity = new UserCredentialsEntity();
			userCredentialsEntity.identifier = randomUUID().toString();
			userCredentialsEntity.status = StatusEnum.ACTIVE;
			userCredentialsEntity.hash = hashPassword.hash;
			userCredentialsEntity.salt = hashPassword.salt;
			userCredentialsEntity.userName = userCommunicationEntity.email;
			userCredentialsEntity.userId = userEntity.identifier;

			const result: ICreateUserMapEntityServiceResult = {
				entity: {
					users: userEntity,
					communications: userCommunicationEntity,
					keys: userKeysEntity,
					settings: userSettingsEntity,
					credentials: userCredentialsEntity,
				},
			};

			return ResultFactory.success(result);
		});
	}
}
