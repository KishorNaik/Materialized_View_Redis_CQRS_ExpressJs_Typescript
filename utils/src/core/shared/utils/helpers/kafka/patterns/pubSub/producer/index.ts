import { Kafka, Producer, logLevel } from 'kafkajs';
import { PubSubMessageKafka } from '../../../types';

export class PubSubProducerKafka {
	private kafka: Kafka;
	private producer: Producer;
	private topic: string;

	public constructor(brokers: string[], clientId: string, topic: string) {
		this.kafka = new Kafka({ clientId, brokers, logLevel: logLevel.INFO });
		this.producer = this.kafka.producer();
		this.topic = topic;
	}

	public async publishMessageAsync<T>(message: PubSubMessageKafka<T>): Promise<void> {
		try {
			await this.producer.connect();
			const payload = { value: JSON.stringify(message) };

			for (let attempt = 0; attempt < 3; attempt++) {
				try {
					await this.producer.send({ topic: this.topic, messages: [payload] });
					console.log(`[PubSubProducer] Published message:`, message);
					break;
				} catch (error) {
					console.error(`[PubSubProducer] Attempt ${attempt + 1} failed:`, error);
					if (attempt === 2) throw error;
				}
			}
		} finally {
			await this.producer.disconnect();
		}
	}
}
