import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';
import { SenderReceiverMessageKafka } from '../../../types';

export class SenderReceiverConsumerKafka {
	private kafka: Kafka;
	private consumer: Consumer;
	private topic: string;

	public constructor(brokers: string[], clientId: string, topic: string) {
		this.kafka = new Kafka({ clientId, brokers, logLevel: logLevel.INFO });
		this.consumer = this.kafka.consumer({ groupId: clientId });
		this.topic = topic;
	}

	public async startConsumingAsync<T>(
		onMessage: (msg: SenderReceiverMessageKafka<T> | null) => Promise<void>
	): Promise<void> {
		await this.consumer.connect();
		await this.consumer.subscribe({ topic: this.topic, fromBeginning: true });

		await this.consumer.run({
			eachMessage: async ({ message }) => {
				if (!message.value) return;
				const parsedMessage = JSON.parse(
					message.value.toString()
				) as SenderReceiverMessageKafka<T>;

				for (let attempt = 0; attempt < 3; attempt++) {
					try {
						await onMessage(parsedMessage);
						break;
					} catch (error) {
						console.error(`Attempt ${attempt + 1} failed:`, error);
						if (attempt === 2) throw error;
					}
				}
			},
		});
	}
}
