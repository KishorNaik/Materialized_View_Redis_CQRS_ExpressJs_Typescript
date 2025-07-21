import { connect, AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { SenderReceiverMessageRabbitMq } from '../../../types';

export class SenderReceiverConsumerRabbitMq {
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

		this.connection.on('connect', () => console.log('Sender_Receiver Consumer connected!'));
		this.connection.on('disconnect', (err) =>
			console.error('Sender_Receiver Consumer disconnected!', err)
		);
	}

	async startConsumingAsync<T>(
		queueName: string,
		onMessage: (msg: SenderReceiverMessageRabbitMq<T> | null) => Promise<void>
	): Promise<void> {
		try {
			await this.channel.consume(queueName, async (msg) => {
				if (msg) {
					const json = msg.content.toString('utf-8');
					const rawData = JSON.stringify(JSON.parse(json));
					const data = JSON.parse(rawData);
					const parsedMessage: SenderReceiverMessageRabbitMq<T> = JSON.parse(
						data
					) as SenderReceiverMessageRabbitMq<T>;
					await onMessage(parsedMessage);
					this.channel.ack(msg);
				} else {
					await onMessage(null);
				}
			});
			console.log(`Consuming messages from ${queueName}`);
		} catch (error) {
			console.error('Error while consuming message:', error);
		}
	}

	public closeAsync(): Promise<void> {
		return this.connection.close();
	}
}
