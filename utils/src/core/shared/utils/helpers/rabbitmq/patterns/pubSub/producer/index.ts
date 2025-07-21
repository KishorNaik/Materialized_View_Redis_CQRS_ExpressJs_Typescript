import { connect, AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { PubSubMessageRabbitMq, SenderReceiverMessageRabbitMq } from '../../../types';
import { ConfirmChannel } from 'amqplib';

export class PubSubProducerRabbitMq {
	private connection: AmqpConnectionManager;
	private channel: ChannelWrapper;

	constructor(url: string, exchangeName: string) {
		this.connection = connect([url]);
		this.channel = this.connection.createChannel({
			json: true,
			setup: (channel: ConfirmChannel) =>
				channel.assertExchange(exchangeName, 'topic', { durable: true }),
		});

		this.connection.on('connect', () => console.log('PubSub Producer connected!'));
		this.connection.on('disconnect', (err) =>
			console.error('PubSub Producer disconnected!', err)
		);
	}

	public async publishAsync<T>(
		exchangeName: string,
		routingKey: string,
		message: PubSubMessageRabbitMq<T>
	): Promise<void> {
		try {
			await this.channel.publish(exchangeName, routingKey, JSON.stringify(message), {
				persistent: true,
			});
			console.log(`Message published to ${exchangeName}`);
		} catch (error) {
			console.error('Failed to publish message:', error);
		}
	}

	public closeAsync(): Promise<void> {
		return this.connection.close();
	}
}
