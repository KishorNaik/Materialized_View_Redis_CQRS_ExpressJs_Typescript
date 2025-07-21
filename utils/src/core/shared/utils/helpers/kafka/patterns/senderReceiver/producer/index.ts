import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';
import { SenderReceiverMessageKafka } from '../../../types';

export class SenderReceiverProducerKafka {
	private kafka: Kafka;
	private producer: Producer;
	private topic: string;

	public constructor(brokers: string[], clientId: string, topic: string) {
		this.kafka = new Kafka({ clientId, brokers, logLevel: logLevel.INFO });
		this.producer = this.kafka.producer();
		this.topic = topic;
	}

	public async sendAsync<T>(message: SenderReceiverMessageKafka<T>): Promise<void> {
		try {
			await this.producer.connect();

			const payload = {
				value: JSON.stringify(message),
			};

			for (let attempt = 0; attempt < 3; attempt++) {
				try {
					await this.producer.send({
						topic: this.topic,
						messages: [payload],
					});
					break;
				} catch (error) {
					if (attempt === 2) {
						throw error;
					}
				}
			}
		} catch (ex) {
			throw ex;
		} finally {
			await this.producer.disconnect();
		}
	}
}
