import { getTraceId, logger } from '@/shared/utils/helpers/loggers';
import {
	OutboxEntity,
	UpdateOutboxDbService,
	QueryRunner,
	JobStatusEnum,
	UserEntity,
} from '@kishornaik/db';
import {
	BoolEnum,
	Container,
	IServiceHandlerVoidAsync,
	JsonString,
	ReplyMessageBullMq,
	RequestReplyMessageBullMq,
	RequestReplyProducerBullMq,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusCodes,
	ExceptionsWrapper,
	VOID_RESULT,
	VoidResult,
	GuardWrapper,
  FireAndForgetWrapper,
} from '@kishornaik/utils';
import { randomUUID } from 'crypto';
import { UpdateEmailService } from '../updateEmail';
import { UserSharedCacheService } from '@/modules/users/shared/cache/set/index ';
import { PublishUserSharedCacheDomainEventService } from '@/modules/users/shared/cache/events/publish';

export interface IPublishWelcomeUserEmailIntegrationEventServiceParameters {
	producer: RequestReplyProducerBullMq;
	queueName: string;
	services: {
		updateOutboxDbService: UpdateOutboxDbService;
		updateEmailService: UpdateEmailService;
	};
	outbox: OutboxEntity;
	queryRunner: QueryRunner;
}

export interface IPublishWelcomeUserEmailIntegrationEventService
	extends IServiceHandlerVoidAsync<IPublishWelcomeUserEmailIntegrationEventServiceParameters> {}

@sealed
@Service()
export class PublishWelcomeUserEmailIntegrationEventService implements IPublishWelcomeUserEmailIntegrationEventService {

  private readonly _publishUserSharedCacheDomainEventService: PublishUserSharedCacheDomainEventService;

  public constructor() {
    this._publishUserSharedCacheDomainEventService = Container.get(PublishUserSharedCacheDomainEventService);
  }

	private async reverseOutboxAsync(
		outbox: OutboxEntity,
		updateOutboxDbService: UpdateOutboxDbService,
		queryRunner: QueryRunner
	) {
		// Reverse Outbox
		outbox.isPublished = BoolEnum.NO;
		outbox.jobStatus = JobStatusEnum.PENDING;
		outbox.lockedBy = null;
		outbox.lockedAt = null;
		const updateDbResult = await updateOutboxDbService.handleAsync(outbox, queryRunner);
		if (updateDbResult.isErr()) {
			return ResultFactory.error(
				updateDbResult.error.statusCode,
				updateDbResult.error.message
			);
		}

		return ResultFactory.success(VOID_RESULT);
	}

	public async handleAsync(
		params: IPublishWelcomeUserEmailIntegrationEventServiceParameters
	): Promise<Result<VoidResult, ResultError>> {
		var result =await ExceptionsWrapper.tryCatchResultAsync<{user:UserEntity; traceId: string}>(async () => {
			const {
				producer,
				outbox,
				queryRunner,
				services: { updateOutboxDbService, updateEmailService },
				queueName,
			} = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(producer, 'producer')
				.check(outbox, 'outbox')
				.check(queryRunner, 'queryRunner')
				.check(updateOutboxDbService, 'updateOutboxDbService')
				.check(queueName, 'queueName')
				.check(updateEmailService, 'updateEmailService')
				.validate();
			if (guardResult.isErr()) {
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);
			}

			// Parse User Data
			const userData: UserEntity = JSON.parse(outbox.payload);

			// Payload
			const payload = {
				email: userData.userCommunication.email,
				fullName: `${userData.firstName} ${userData.lastName}`,
				emailVerificationToken: userData.userSettings.emailVerificationToken,
			};

			// Generate Message
			const message: RequestReplyMessageBullMq<JsonString> = {
				correlationId: randomUUID().toString(),
				timestamp: new Date().toISOString(),
				traceId: outbox.traceId,
				data: JSON.stringify(payload) as JsonString,
			};

			// Send Message Queue
			const messageResult: ReplyMessageBullMq<JsonString> = await producer.sendAsync<
				JsonString,
				JsonString
			>(`JOB:${queueName}`, message);

			if (!messageResult.success) {
				await this.reverseOutboxAsync(outbox, updateOutboxDbService, queryRunner);
				return ResultFactory.error(messageResult.statusCode, messageResult.message);
			}

			// Update Email Status
			const updateEmailStatusResult = await updateEmailService.handleAsync({
				user: userData,
				queryRunner: queryRunner,
			});
			if (updateEmailStatusResult.isErr()) {
				await this.reverseOutboxAsync(outbox, updateOutboxDbService, queryRunner);
				return ResultFactory.error(
					updateEmailStatusResult.error.statusCode,
					updateEmailStatusResult.error.message
				);
			}

			// OutBox Update
			outbox.isPublished = BoolEnum.YES;
			outbox.jobStatus = JobStatusEnum.COMPLETED;
			const updateDbResult = await updateOutboxDbService.handleAsync(outbox, queryRunner);
			if (updateDbResult.isErr()) {
				return ResultFactory.error(messageResult.statusCode, messageResult.message);
			}
			logger.info(`SendEmailEventService: ${messageResult.correlationId} is send`);

			return ResultFactory.success({
        user: userData,
        traceId: outbox.traceId
      });
		});

    if (result.isErr()) {
      return ResultFactory.error(result.error.statusCode, result.error.message);
    }

    // Update User Shared Cache
    FireAndForgetWrapper.JobAsync({
            onRun: async () => {
              logger.info(`Publish: Welcome User Email Integration Event Fire and Forgot => Update IsEmail Send User Cache Start`);


              if(result.isErr()) {
                logger.error(`Publish: Welcome User Email Integration Event Fire and Forgot => Update IsEmail Send User Cache. error ${result.error.message}`);
                return;
              }

              // Get User Entity Data
              const users = result.value.user;
              const traceId = result.value.traceId;
              logger.info(`Publish: Welcome User Email Integration Event Fire and Forgot => Update IsEmail Send User Cache. traceId: ${traceId}`);

              // Publish Shared Service
              await this._publishUserSharedCacheDomainEventService.handleAsync({
                identifier: users.identifier,
                status: users.status,
                traceId: traceId,
              });
            },
            onError: (ex: Error) => {
              logger.error(`Publish: Welcome User Email Integration Event Fire and Forgot => Update IsEmail Send User Cache. error ${ex.message}`);
            },
            onCleanup: async () => {
              // Cleanup
              logger.info(`Publish: Welcome User Email Integration Event Fire and Forgot => Update IsEmail Send User Cache. cleanup with end`);
            },
          });


    return ResultFactory.success(VOID_RESULT);
	}
}
