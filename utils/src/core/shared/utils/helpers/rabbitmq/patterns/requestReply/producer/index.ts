import { connect, AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { ReplyMessageRabbitMq, RequestReplyMessageRabbitMq } from '../../../types';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { Guid } from 'guid-typescript';

export class RequestReplyProducerRabbitMq {
	private connection: AmqpConnectionManager;
	private channel: ChannelWrapper;

	constructor(url: string, queueName: string) {
		this.connection = connect([url]);
		this.channel = this.connection.createChannel({
			json: true,
			setup: (channel: ConfirmChannel) => channel.assertQueue(queueName, { durable: true }),
		});

		this.connection.on('connect', () => console.log('RequestReply Producer connected!'));
		this.connection.on('disconnect', (err) =>
			console.error('RequestReply Producer disconnected!', err)
		);
	}

	public async sendAsync<TRequest, TResponse>(
		queueName: string,
		replyQueueName: string,
		message: RequestReplyMessageRabbitMq<TRequest>
	): Promise<ReplyMessageRabbitMq<TResponse>> {
		const correlationId = message?.correlationId || Guid.create().toString();
		const replyQueue = replyQueueName || `reply_queue`;

		return new Promise<ReplyMessageRabbitMq<TResponse>>((resolve, reject) => {
			try {
				this.channel.consume(
					replyQueue,
					(msg: ConsumeMessage | null) => {
						if (msg && msg.properties.correlationId === correlationId) {
							const json = msg.content.toString('utf-8');
							const rawData = JSON.stringify(JSON.parse(json));
							const data = JSON.parse(rawData);

							if (!data) {
								console.error(
									`No data received for correlationId ${correlationId}.`
								);
								this.channel!.ack(msg);
								return;
							}

							const parsedMessage: ReplyMessageRabbitMq<TResponse> =
								data as ReplyMessageRabbitMq<TResponse>;
							resolve(parsedMessage as ReplyMessageRabbitMq<TResponse>);
							this.channel!.ack(msg);
						}
					},
					{ noAck: false }
				);

				this.channel!.sendToQueue(queueName, JSON.stringify(message), {
					correlationId: correlationId,
					replyTo: replyQueue,
					persistent: true,
				});
			} catch (ex) {
				console.error('Failed to send message:', ex);
				reject(ex);
			}
		});
	}

	public closeAsync(): Promise<void> {
		return this.connection.close();
	}
}
