import {
	ExceptionsWrapper,
	generateSecureRandomString,
	IServiceHandlerNoParamsAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
} from '@kishornaik/utils';

export interface ICreateUserKeysServiceResult {
	aesSecretKey: string;
	hmacSecretKey: string;
}

export interface ICreateUserKeyService
	extends IServiceHandlerNoParamsAsync<ICreateUserKeysServiceResult> {}

@sealed
@Service()
export class CreateUserKeysService implements ICreateUserKeyService {
	public handleAsync(): Promise<Result<ICreateUserKeysServiceResult, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			const results: ICreateUserKeysServiceResult = {
				aesSecretKey: generateSecureRandomString(32),
				hmacSecretKey: generateSecureRandomString(64),
			};
			return ResultFactory.success(results);
		});
	}
}
