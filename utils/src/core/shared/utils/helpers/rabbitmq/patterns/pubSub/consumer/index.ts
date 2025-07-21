import { connect, AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { PubSubMessageRabbitMq } from '../../../types';
import { ConfirmChannel } from 'amqplib';

export class PubSubConsumerRabbitMq {
	private connection: AmqpConnectionManager;
	private channel: ChannelWrapper;

	constructor(url: string, exchangeName: string, queueName: string) {
		this.connection = connect([url]);
		this.channel = this.connection.createChannel({
			json: true,
			setup: (channel: ConfirmChannel) => {
				return Promise.all([
					channel.assertQueue(queueName, { exclusive: true, autoDelete: true }),
					channel.assertExchange(exchangeName, 'topic'),
					channel.prefetch(1),
					channel.bindQueue(queueName, exchangeName, '#'),
				]);
			},
		});

		this.connection.on('connect', () => console.log('PubSub Consumer connected!'));
		this.connection.on('disconnect', (err) =>
			console.error('PubSub Consumer disconnected!', err)
		);
	}

	public async subscribeAsync<T>(
		queueName: string,
		callback: (message: PubSubMessageRabbitMq<T>) => Promise<void>
	): Promise<void> {
		try {
			await this.channel.consume(queueName, async (msg) => {
				if (msg) {
					const json = msg.content.toString('utf-8');
					const rawData = JSON.stringify(JSON.parse(json));
					const data = JSON.parse(rawData);
					const message: PubSubMessageRabbitMq<T> = JSON.parse(
						data
					) as PubSubMessageRabbitMq<T>;
					await callback(message);
					this.channel.ack(msg);
				}
			});
		} catch (error) {
			console.error('Failed to subscribe to queue:', error);
		}
	}

	public closeAsync(): Promise<void> {
		return this.connection.close();
	}
}
