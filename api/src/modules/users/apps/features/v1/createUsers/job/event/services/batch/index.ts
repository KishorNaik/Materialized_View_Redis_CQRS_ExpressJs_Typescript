import { OutboxEntity, UpdateOutboxDbService, QueryRunner, getQueryRunner } from '@kishornaik/db';
import {
	ExceptionsWrapper,
	executeBatchArrayAsync,
	GuardWrapper,
	IServiceHandlerVoidAsync,
	RequestReplyProducerBullMq,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	VOID_RESULT,
	VoidResult,
} from '@kishornaik/utils';
import { PublishWelcomeUserEmailEventService } from '../publishEvent';
import { logger } from '@/shared/utils/helpers/loggers';
import { UpdateEmailService } from '../updateEmail';

export interface IOutboxBatchParameters {
	outboxList: OutboxEntity[];
	services: {
		publishWelcomeUserEmailIntegrationEvent: PublishWelcomeUserEmailEventService;
		updateOutboxDbService: UpdateOutboxDbService;
    updateEmailService:UpdateEmailService;
	};
	producer: RequestReplyProducerBullMq;
	queryRunner: QueryRunner;
	queueName: string;
}

export interface IOutboxBatchService extends IServiceHandlerVoidAsync<IOutboxBatchParameters> {}

@sealed
@Service()
export class OutboxBatchService implements IOutboxBatchService {
	public handleAsync(params: IOutboxBatchParameters): Promise<Result<VoidResult, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { outboxList, services, producer, queryRunner, queueName } = params;
			const { publishWelcomeUserEmailIntegrationEvent, updateOutboxDbService, updateEmailService } = services;

			// Guard
			const guardResult = new GuardWrapper()
				.check(outboxList, 'outboxList')
				.check(updateOutboxDbService, 'updateOutboxDbService')
				.check(producer, 'producer')
				.check(queryRunner, 'queryRunner')
				.check(
					publishWelcomeUserEmailIntegrationEvent,
					'publishWelcomeUserEmailIntegrationEvent'
				)
				.check(queueName, 'queueName')
        .check(updateEmailService, 'updateEmailService')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// BatchWise Execution
			const results = await executeBatchArrayAsync({
				items: outboxList,
				handler: async (outbox) => {
					// Publish Event
					var result = await publishWelcomeUserEmailIntegrationEvent.handleAsync({
						producer: producer,
						outbox: outbox,
						services: {
							updateOutboxDbService: updateOutboxDbService,
              updateEmailService:updateEmailService
						},
						queryRunner: queryRunner,
						queueName: queueName,
					});
					if (result.isErr()) {
						logger.error(
							`Batch:Failed to send email to ${outbox.identifier}, error: ${result.error.message}`);
					} else {
						logger.info(`Batch:Email sent to ${outbox.identifier}`);
					}
					return result;
				},
				batchSize: 3,
				concurrency: 3, // Optional throttle
				runMode: 'parallel',
			});

			if (results.error.length >= 1) {
				logger.error(`Failed to send emails to ${results.error.length} users`);
				for (const error of results.error) {
					if (error.isErr()) {
						logger.error(`batch error: ${error.error.message}`);
					}
				}
			}

			return ResultFactory.success(VOID_RESULT);
		});
	}
}
