export interface PubSubMessageKafka<T> {
	data: T;
	correlationId?: string;
	traceId?: string;
	timestamp?: string; // ISO 8601 format
}

export interface SenderReceiverMessageKafka<T> extends PubSubMessageKafka<T> {}

export type WorkerKafka = () => Promise<void>;
