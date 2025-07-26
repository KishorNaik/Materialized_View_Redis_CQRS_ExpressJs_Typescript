import { logger } from '@/shared/utils/helpers/loggers';
import {
	bullMqRedisConnection,
	Container,
	GuardWrapper,
	JsonString,
	ReplyMessageBullMq,
	RequestReplyConsumerBullMq,
	StatusCodes,
	WorkerBullMq,
} from '@kishornaik/utils';
import { WelcomeUserEmailMapService } from './services/maps';
import { WelcomeUserEmailValidationService } from './services/validations';
import { WelcomeUserEmailIntegrationEventRequestDto } from '../contracts';
import { EmailSentService } from './services/sendEmail';

const queueName = 'send-welcome-user-integration-event-queue';
const consumer = new RequestReplyConsumerBullMq(bullMqRedisConnection);

export const subscribeWelcomeUserEmailIntegrationEvent: WorkerBullMq = async () => {
	console.log(`subscribeWelcomeUserEmailIntegrationEvent started...`);
	const worker = await consumer.startConsumingAsync<JsonString, JsonString>(
		queueName,
		async (reply) => {
			const { data, correlationId, timestamp, traceId } = reply.data;
			logger.info(
				`WelcomeUserEmailIntegrationEvent Job started: traceId: ${traceId} | correlationId: ${correlationId} | jobId: ${reply.id}`
			);

			// Guard
			const guardResult = new GuardWrapper()
				.check(reply, 'reply')
				.check(data, 'data')
				.check(correlationId, 'correlationId')
				.check(timestamp, 'timestamp')
				.check(traceId, 'traceId')
				.validate();
			if (guardResult.isErr())
				return {
					success: false,
					correlationId: correlationId,
					statusCode: StatusCodes.BAD_REQUEST,
					traceId: traceId,
					error: guardResult.error.message,
					message: null,
					data: null,
				};

			// map
			const mapResult = await Container.get(WelcomeUserEmailMapService).handleAsync(data);
			if (mapResult.isErr())
				return {
					success: false,
					correlationId: correlationId,
					statusCode: mapResult.error.statusCode,
					traceId: traceId,
					error: mapResult.error.message,
					message: null,
					data: null,
				};

			// validation
			const validationResult = await Container.get(
				WelcomeUserEmailValidationService
			).handleAsync({
				dto: mapResult.value,
				dtoClass: WelcomeUserEmailIntegrationEventRequestDto,
			});
			if (validationResult.isErr())
				return {
					success: false,
					correlationId: correlationId,
					statusCode: validationResult.error.statusCode,
					traceId: traceId,
					error: validationResult.error.message,
					message: null,
					data: null,
				};

			// Send Welcome User Email
			const emailSentResult = await Container.get(EmailSentService).handleAsync(
				mapResult.value
			);
			if (emailSentResult.isErr())
				return {
					success: false,
					correlationId: correlationId,
					statusCode: emailSentResult.error.statusCode,
					traceId: traceId,
					error: emailSentResult.error.message,
					message: null,
					data: null,
				};

			// Return reply to Producer
			const message: ReplyMessageBullMq<JsonString> = {
				correlationId: reply.data.correlationId,
				success: true,
				data: `Successfully processed request with data: ${reply.data.correlationId}}` as JsonString,
				message: `Processed request with data: ${JSON.stringify(reply.data.data)}`,
			};

			return message;
		}
	);

	worker.on('completed', (job) => {
		logger.info(
			`WelcomeUserEmailIntegrationEvent Job completed: traceId: ${job.data.traceId} | correlationId: ${job.data.correlationId} | jobId: ${job.id}`
		);
	});

	worker.on('failed', (job, err) => {
		logger.error(
			`WelcomeUserEmailIntegrationEvent Job failed: traceId: ${job.data.traceId} | correlationId: ${job.data.correlationId} | jobId: ${job.id} | error: ${err.message}`
		);
	});
};
