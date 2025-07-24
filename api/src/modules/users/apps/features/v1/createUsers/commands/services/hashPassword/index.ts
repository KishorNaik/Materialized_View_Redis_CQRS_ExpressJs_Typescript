import {
	HashPasswordService,
	IHashPasswordResult,
} from '@/shared/services/users/user.HashPassword.Service';
import {
	Container,
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusCodes,
} from '@kishornaik/utils';

export interface ICreateUserHashPasswordServiceParameters {
	password: string;
}

export interface ICreateUserHashPasswordService
	extends IServiceHandlerAsync<ICreateUserHashPasswordServiceParameters, IHashPasswordResult> {}

@sealed
@Service()
export class CreateUserHashPasswordService implements ICreateUserHashPasswordService {
	private readonly _hashPasswordService: HashPasswordService;

	public constructor() {
		this._hashPasswordService = Container.get(HashPasswordService);
	}

	public handleAsync(
		params: ICreateUserHashPasswordServiceParameters
	): Promise<Result<IHashPasswordResult, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			// Guard
			const guardResult = new GuardWrapper()
				.check(params, `params`)
				.check(params.password, `password`)
				.validate();

			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			const { password } = params;

			// Hash Password
			const hashResult = await this._hashPasswordService.hashPasswordAsync(password);

			// Return Result
			return hashResult;
		});
	}
}
