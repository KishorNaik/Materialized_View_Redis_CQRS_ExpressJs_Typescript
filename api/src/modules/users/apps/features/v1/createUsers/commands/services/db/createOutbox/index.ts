import { UserEntity, QueryRunner, AddOutboxDbService, OutboxEntity, JobStatusEnum } from '@kishornaik/db';
import {
	IServiceHandlerVoidAsync,
	Result,
	ResultError,
	sealed,
	Service,
	VoidResult,
  ExceptionsWrapper,
  GuardWrapper,
	ResultFactory,
	VOID_RESULT,
	StatusCodes,
	Container,
	StatusEnum,
	BoolEnum,
} from '@kishornaik/utils';
import { randomUUID } from 'crypto';
import { ICreateUserMapEntityServiceResult } from '../../mapEntity';

Container.set<AddOutboxDbService>(AddOutboxDbService, new AddOutboxDbService());

export interface ICreateOutboxDbServiceParameters {
	entity: ICreateUserMapEntityServiceResult;
	queryRunner: QueryRunner;
}

export interface ICreateOutboxDbService
	extends IServiceHandlerVoidAsync<ICreateOutboxDbServiceParameters> {}

  @sealed
@Service()
export class CreateOutboxDbService implements ICreateOutboxDbService {
	private readonly _addOutboxDbService: AddOutboxDbService;

	public constructor() {
		this._addOutboxDbService = Container.get(AddOutboxDbService);
	}

	public handleAsync(
		params: ICreateOutboxDbServiceParameters
	): Promise<Result<VoidResult, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			// Guard
			const { entity, queryRunner } = params;

      const guardResult = new GuardWrapper()
        .check(params, 'params')
        .check(entity, 'user')
        .check(queryRunner, 'queryRunner')
        .validate();
      if (guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

      // Map
      entity.entity.users.userCommunication=entity.entity.communications;
      entity.entity.users.userCredentials=entity.entity.credentials;
      entity.entity.users.userKeys=entity.entity.keys;
      entity.entity.users.userSettings=entity.entity.settings;

			// Generate Payload
			const payload: string = JSON.stringify(entity.entity.users);

			// Map
			const outbox: OutboxEntity = new OutboxEntity();
			outbox.identifier = randomUUID().toString();
			outbox.eventType = 'send-welcome-user-integration-event-queue';
			outbox.status = StatusEnum.ACTIVE;
			outbox.isPublished = BoolEnum.NO;
			outbox.payload = payload;
			outbox.created_date = new Date();
			outbox.modified_date = new Date();
      outbox.jobStatus=JobStatusEnum.PENDING;
      outbox.lockedBy=`machine_1`; // Take from .env file

			// Add
			const result = await this._addOutboxDbService.handleAsync(outbox, queryRunner);
			if (result.isErr()) return ResultFactory.errorInstance(result.error);

			return ResultFactory.success(VOID_RESULT);
		});
	}
}
