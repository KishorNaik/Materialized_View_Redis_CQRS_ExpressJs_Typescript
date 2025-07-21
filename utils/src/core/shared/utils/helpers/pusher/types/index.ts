export interface PubSubMessagePusher<T> {
	data: T;
	correlationId?: string;
	traceId?: string;
	timestamp?: string; // ISO 8601 format
}

export type WorkerPusher = () => Promise<void>;
