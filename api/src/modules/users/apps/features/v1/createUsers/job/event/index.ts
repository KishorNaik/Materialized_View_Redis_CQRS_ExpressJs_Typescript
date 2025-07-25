import { logger } from '@/shared/utils/helpers/loggers';
import { GetOutboxDbService, getQueryRunner, UpdateOutboxDbService } from '@kishornaik/db';
import {
	WorkerCronJob,
	CronJob,
	RequestReplyProducerBullMq,
	bullMqRedisConnection,
	Container,
	sealed,
	Service,
	IServiceHandlerNoParamsVoid,
	Result,
	ResultError,
	VoidResult,
	ExceptionsWrapper,
	ResultFactory,
	VOID_RESULT,
	IServiceHandlerNoParamsVoidAsync,
	StatusCodes,
	TransactionsWrapper,
} from '@kishornaik/utils';
import { GetOutboxListService } from './services/getOutboxList';
import { OutboxBatchService } from './services/batch';
import { PublishWelcomeUserEmailEventService } from './services/publishEvent';
import { UpdateEmailService } from './services/updateEmail';

// Define Queue
const queueName = 'send-welcome-user-integration-event-queue';
const producer = new RequestReplyProducerBullMq(bullMqRedisConnection);
producer.setQueues(queueName).setQueueEvents();

// Define Outbox Db Service
Container.set<UpdateOutboxDbService>(UpdateOutboxDbService, new UpdateOutboxDbService());
Container.set<GetOutboxDbService>(GetOutboxDbService, new GetOutboxDbService());

export interface ISendWelcomeUserIntegrationEventService extends IServiceHandlerNoParamsVoidAsync {}

@sealed
@Service()
export class SendWelcomeUserIntegrationEventService
	implements ISendWelcomeUserIntegrationEventService
{
	private readonly _getOutboxDbService: GetOutboxDbService;
	private readonly _updateOutboxDbService: UpdateOutboxDbService;
	private readonly _getOutboxListService: GetOutboxListService;
	private readonly _outboxBatchService: OutboxBatchService;
	private readonly _publishWelcomeUserEmailEventService: PublishWelcomeUserEmailEventService;
  private readonly _updateEmailService:UpdateEmailService;

	public constructor() {
		this._getOutboxDbService = Container.get(GetOutboxDbService);
		this._updateOutboxDbService = Container.get(UpdateOutboxDbService);
		this._getOutboxListService = Container.get(GetOutboxListService);
		this._outboxBatchService = Container.get(OutboxBatchService);
		this._publishWelcomeUserEmailEventService = Container.get(
			PublishWelcomeUserEmailEventService
		);
    this._updateEmailService = Container.get(UpdateEmailService);
	}

	public async handleAsync(): Promise<Result<VoidResult, ResultError>> {
		const queryRunner = getQueryRunner();
		await queryRunner.connect();

		return await TransactionsWrapper.runResultAsync({
			queryRunner: queryRunner,
			onTransaction: async () => {
				// Get Outbox List
				const getOutBoxListResult = await this._getOutboxListService.handleAsync({
					eventType: `WelcomeUserEmailIntegrationEvent`,
					instanceId: `machine_1`,
					queryRunner: queryRunner,
					getOutboxDbService: this._getOutboxDbService,
				});
				if (getOutBoxListResult.isErr()) {
					if (getOutBoxListResult.error.statusCode !== StatusCodes.NOT_FOUND) {
						await queryRunner.rollbackTransaction();
						return ResultFactory.error(
							getOutBoxListResult.error.statusCode,
							getOutBoxListResult.error.message
						);
					}
					logger.info('No outbox list found');
					return ResultFactory.success(VOID_RESULT);
				}


				const outboxList = getOutBoxListResult.value;
        logger.info(`outbox list length ${outboxList.length}`);

				// Send Integration Event BatchWise
				await this._outboxBatchService.handleAsync({
					outboxList: outboxList,
					services: {
						publishWelcomeUserEmailIntegrationEvent:
							this._publishWelcomeUserEmailEventService,
						updateOutboxDbService: this._updateOutboxDbService,
            updateEmailService: this._updateEmailService
					},
					producer: producer,
					queryRunner: queryRunner,
					queueName: queueName,
				});

				return ResultFactory.success(VOID_RESULT);
			}
		});
	}
}
