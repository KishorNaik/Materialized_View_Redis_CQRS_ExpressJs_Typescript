import { getTraceId, logger } from '@/shared/utils/helpers/loggers';
import { OutboxEntity, UpdateOutboxDbService, QueryRunner, JobStatusEnum, UserEntity } from '@kishornaik/db';
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
} from '@kishornaik/utils';
import { randomUUID } from 'crypto';
import { UpdateEmailService } from '../updateEmail';

export interface IPublishWelcomeUserEmailEventServiceParameters {
	producer: RequestReplyProducerBullMq;
	queueName: string;
	services: {
		updateOutboxDbService: UpdateOutboxDbService;
    updateEmailService:UpdateEmailService;
	};
	outbox: OutboxEntity;
	queryRunner: QueryRunner;
}

export interface IPublishWelcomeUserEmailEventService
	extends IServiceHandlerVoidAsync<IPublishWelcomeUserEmailEventServiceParameters> {}

@sealed
@Service()
export class PublishWelcomeUserEmailEventService implements IPublishWelcomeUserEmailEventService {
	public async handleAsync(
		params: IPublishWelcomeUserEmailEventServiceParameters
	): Promise<Result<VoidResult, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			const {
				producer,
				outbox,
				queryRunner,
				services: { updateOutboxDbService,updateEmailService },
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
			const userData:UserEntity = JSON.parse(outbox.payload);

      // Payload
      const payload = {
        email: userData.userCommunication.created_date,
        fullName: `${userData.firstName} ${userData.lastName}`,
        emailVerificationToken: userData.userSettings.emailVerificationToken
      };

			// Generate Message
			const message: RequestReplyMessageBullMq<JsonString> = {
				correlationId: randomUUID().toString(),
				timestamp: new Date().toISOString(),
				traceId: getTraceId(),
				data: JSON.stringify(payload) as JsonString,
			};

			// Send Message Queue
			const messageResult: ReplyMessageBullMq<JsonString> = await producer.sendAsync<
				JsonString,
				JsonString
			>(`JOB:${queueName}`, message);

			if (!messageResult.success) {
				return ResultFactory.error(messageResult.statusCode, messageResult.message);
			}

			// OutBox Update
			outbox.isPublished = BoolEnum.YES;
			outbox.jobStatus = JobStatusEnum.COMPLETED;
			const updateDbResult = await updateOutboxDbService.handleAsync(outbox, queryRunner);
			if (updateDbResult.isErr()) {
				return ResultFactory.error(messageResult.statusCode, messageResult.message);
			}
			logger.info(`SendEmailEventService: ${messageResult.correlationId} is send`);

      // Update Email Status
      const updateEmailStatusResult = await updateEmailService.handleAsync({
        user:userData,
        queryRunner:queryRunner
      });
      if(updateEmailStatusResult.isErr())
        return ResultFactory.error(updateEmailStatusResult.error.statusCode,updateEmailStatusResult.error.message);

			return ResultFactory.success(VOID_RESULT);
		});
	}
}
