import {
	AddUserCommunicationDbService,
	AddUserCredentialsDbService,
	AddUserKeysDbService,
	AddUsersDbService,
	AddUserSettingsDbService,
	UserEntity,
} from '@kishornaik/db';
import {
	Container,
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	IServiceHandlerVoidAsync,
	QueryRunner,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	VOID_RESULT,
	VoidResult,
} from '@kishornaik/utils';
import { ICreateUserMapEntityServiceResult } from '../mapEntity';

Container.set<AddUsersDbService>(AddUsersDbService, new AddUsersDbService());
Container.set<AddUserCommunicationDbService>(
	AddUserCommunicationDbService,
	new AddUserCommunicationDbService()
);
Container.set<AddUserCredentialsDbService>(
	AddUserCredentialsDbService,
	new AddUserCredentialsDbService()
);
Container.set<AddUserSettingsDbService>(AddUserSettingsDbService, new AddUserSettingsDbService());
Container.set<AddUserKeysDbService>(AddUserKeysDbService, new AddUserKeysDbService());

export interface ICreateUserDbServiceParameters {
	entity: ICreateUserMapEntityServiceResult;
	queryRunner: QueryRunner;
}

export interface ICreateUserDbService
	extends IServiceHandlerVoidAsync<ICreateUserDbServiceParameters> {}

@sealed
@Service()
export class CreateUserDbService implements ICreateUserDbService {
	private readonly _addUsersDbService: AddUsersDbService;
	private readonly _addUserCommunicationDbService: AddUserCommunicationDbService;
	private readonly _addUserCredentialsDbService: AddUserCredentialsDbService;
	private readonly _addUserKeysDbService: AddUserKeysDbService;
	private readonly _addUserSettingsDbService: AddUserSettingsDbService;

	public constructor() {
		this._addUsersDbService = Container.get(AddUsersDbService);
		this._addUserCommunicationDbService = Container.get(AddUserCommunicationDbService);
		this._addUserCredentialsDbService = Container.get(AddUserCredentialsDbService);
		this._addUserKeysDbService = Container.get(AddUserKeysDbService);
		this._addUserSettingsDbService = Container.get(AddUserSettingsDbService);
	}

	public handleAsync(
		params: ICreateUserDbServiceParameters
	): Promise<Result<VoidResult, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { entity, queryRunner } = params;
			const { users, communications, credentials, keys, settings } = entity.entity;

			// Guard
			const guardResult = new GuardWrapper()
				.check(params, 'params')
				.check(entity, 'entity')
				.check(entity.entity, 'entity.entity')
				.check(users, `entity.entity.users`)
				.check(communications, 'entity.entity.communications')
				.check(credentials, 'entity.entity.credentials')
				.check(keys, 'entity.entity.keys')
				.check(settings, 'entity.entity.settings')
				.check(queryRunner, 'queryRunner')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Add User services
			const userResult = await this._addUsersDbService.handleAsync(users, queryRunner);
			if (userResult.isErr())
				return ResultFactory.error(userResult.error.statusCode, userResult.error.message);

			const communicationResult = await this._addUserCommunicationDbService.handleAsync(
				communications,
				queryRunner
			);
			if (communicationResult.isErr())
				return ResultFactory.error(
					communicationResult.error.statusCode,
					communicationResult.error.message
				);

			const credentialsResult = await this._addUserCredentialsDbService.handleAsync(
				credentials,
				queryRunner
			);
			if (credentialsResult.isErr())
				return ResultFactory.error(
					credentialsResult.error.statusCode,
					credentialsResult.error.message
				);

			const keysResult = await this._addUserKeysDbService.handleAsync(keys, queryRunner);
			if (keysResult.isErr())
				return ResultFactory.error(keysResult.error.statusCode, keysResult.error.message);

			const settingsResult = await this._addUserSettingsDbService.handleAsync(
				settings,
				queryRunner
			);
			if (settingsResult.isErr())
				return ResultFactory.error(
					settingsResult.error.statusCode,
					settingsResult.error.message
				);

			// Return Result
			return ResultFactory.success(VOID_RESULT);
		});
	}
}
