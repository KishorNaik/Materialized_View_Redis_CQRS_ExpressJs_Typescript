import { Kafka, Consumer, logLevel } from 'kafkajs';
import { PubSubMessageKafka } from '../../../types';

export class PubSubConsumerKafka {
	private kafka: Kafka;
	private consumer: Consumer;
	private topic: string;

	constructor(brokers: string[], clientId: string, topic: string) {
		this.kafka = new Kafka({ clientId, brokers, logLevel: logLevel.INFO });
		this.consumer = this.kafka.consumer({ groupId: clientId });
		this.topic = topic;
	}

	async subscribeMessageAsync<T>(
		onMessage: (msg: PubSubMessageKafka<T>) => Promise<void>
	): Promise<void> {
		await this.consumer.connect();
		await this.consumer.subscribe({ topic: this.topic, fromBeginning: true });

		await this.consumer.run({
			eachMessage: async ({ message }) => {
				if (!message.value) return;
				const parsedMessage = JSON.parse(message.value.toString())
					.data as PubSubMessageKafka<T>;

				for (let attempt = 0; attempt < 3; attempt++) {
					try {
						await onMessage(parsedMessage);
						console.log(`[PubSubConsumer] Processed message:`, parsedMessage);
						break;
					} catch (error) {
						console.error(`[PubSubConsumer] Attempt ${attempt + 1} failed:`, error);
						if (attempt === 2) throw error;
					}
				}
			},
		});
	}
}
