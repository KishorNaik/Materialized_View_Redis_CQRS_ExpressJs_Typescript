import {
	bullMqRedisConnection,
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerVoidAsync,
	JsonString,
	RequestReplyProducerBullMq,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	SenderReceiverProducerBullMq,
	SendReceiverMessageBullMq,
	Service,
	StatusEnum,
	VOID_RESULT,
	VoidResult,
} from '@kishornaik/utils';
import { randomUUID } from 'crypto';

// Define Queue
const queueName = 'user-shared-cache-event-queue';
const producer = new SenderReceiverProducerBullMq(bullMqRedisConnection);
producer.setQueues(queueName);

export interface IPublishUserSharedCacheDomainEventServiceParameters {
	identifier: string;
	status: StatusEnum;
	traceId: string;
}

export interface IPublishUserSharedCacheDomainEventService
	extends IServiceHandlerVoidAsync<IPublishUserSharedCacheDomainEventServiceParameters> {}

@sealed
@Service()
export class PublishUserSharedCacheDomainEventService
	implements IPublishUserSharedCacheDomainEventService
{
	public handleAsync(
		params: IPublishUserSharedCacheDomainEventServiceParameters
	): Promise<Result<VoidResult, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { identifier, status, traceId } = params;
			//Guard
			const guardResult = new GuardWrapper()
				.check(params, 'params')
				.check(identifier, 'identifier')
				.check(status, 'status')
				.check(traceId, 'traceId')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Publish Event
			const messages: SendReceiverMessageBullMq<JsonString> = {
				correlationId: randomUUID().toString(),
				timestamp: Date.now().toString(),
				traceId: traceId,
				data: JSON.stringify({ identifier, status }) as JsonString,
			};

			await producer.sendAsync<JsonString>(`JOB:${queueName}`, messages);

			return ResultFactory.success(VOID_RESULT);
		});
	}
}
