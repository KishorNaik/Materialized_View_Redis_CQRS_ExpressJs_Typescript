import { connect, AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { SenderReceiverMessageRabbitMq } from '../../../types';
import { ConfirmChannel } from 'amqplib';

export class SenderReceiverProducerRabbitMq {
	private connection: AmqpConnectionManager;
	private channel: ChannelWrapper;

	constructor(url: string, queueName: string) {
		this.connection = connect([url]);
		this.channel = this.connection.createChannel({
			json: true,
			setup: (channel: ConfirmChannel) => channel.assertQueue(queueName, { durable: true }),
		});

		this.connection.on('connect', () => console.log('Sender_Receiver Producer connected!'));
		this.connection.on('disconnect', (err) =>
			console.error('Sender_Receiver Producer disconnected!', err)
		);
	}

	public async sendAsync<T>(
		queueName: string,
		message: SenderReceiverMessageRabbitMq<T>
	): Promise<void> {
		try {
			await this.channel.sendToQueue(queueName, JSON.stringify(message), {
				persistent: true,
			});
			console.log(`Message sent to ${queueName}`);
		} catch (error) {
			console.error('Failed to send message:', error);
		}
	}

	public closeAsync(): Promise<void> {
		return this.connection.close();
	}
}
