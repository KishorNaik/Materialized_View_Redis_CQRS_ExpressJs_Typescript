import { connect, AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { ReplyMessageRabbitMq, RequestReplyMessageRabbitMq } from '../../../types';

export class RequestReplyConsumerRabbitMq {
	private connection: AmqpConnectionManager;
	private channel: ChannelWrapper;

	constructor(url: string, queueName: string) {
		this.connection = connect([url]);
		this.channel = this.connection.createChannel({
			json: true,
			setup: async (channel: ConfirmChannel) => {
				await channel.assertQueue(queueName, { durable: true });
			},
		});

		this.connection.on('connect', () => console.log('RequestReply Consumer connected!'));
		this.connection.on('disconnect', (err) =>
			console.error('RequestReply Consumer disconnected!', err)
		);
	}

	public async startConsumingAsync<TRequest, TResponse>(
		queueName: string,
		replyQueueName: string,
		onMessage: (
			msg: RequestReplyMessageRabbitMq<TRequest>,
			reply: (response: ReplyMessageRabbitMq<TResponse>) => Promise<void>
		) => Promise<void>
	): Promise<void> {
		const replyQueue = replyQueueName || 'reply_queue';
		await this.channel.assertQueue(replyQueue, { durable: true });

		try {
			await this.channel.addSetup(async (channel: ConfirmChannel) => {
				await channel.assertQueue(queueName, { durable: true });
				await channel.assertQueue(replyQueue, { durable: true });

				await channel.consume(queueName, async (msg: ConsumeMessage | null) => {
					if (msg) {
						const json = msg.content.toString('utf-8');
						const rawData = JSON.stringify(JSON.parse(json));
						const data = JSON.parse(rawData);
						const parsedMessage: RequestReplyMessageRabbitMq<TRequest> = JSON.parse(
							data
						) as RequestReplyMessageRabbitMq<TRequest>;
						await onMessage(
							parsedMessage,
							async (response: ReplyMessageRabbitMq<TResponse>) => {
								await channel.sendToQueue(
									replyQueue,
									Buffer.from(JSON.stringify(response)),
									{
										correlationId:
											response.correlationId || msg.properties.correlationId,
										replyTo: replyQueue,
										persistent: true,
									}
								);
							}
						);
						channel.ack(msg);
					}
				});
			});
		} catch (ex) {
			console.error('Failed to start consuming:', ex);
			throw ex;
		}
	}

	public closeAsync(): Promise<void> {
		return this.connection.close();
	}
}
