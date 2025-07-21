import { StatusCodes } from 'http-status-codes';

export interface PubSubMessageRabbitMq<T> {
	data: T;
	correlationId?: string;
	traceId?: string;
	timestamp?: string; // ISO 8601 format
}

export interface SenderReceiverMessageRabbitMq<T> extends PubSubMessageRabbitMq<T> {}

export interface RequestReplyMessageRabbitMq<T> {
	correlationId?: string;
	traceId?: string;
	timestamp?: string; // ISO 8601 format
	data: T;
}

export interface ReplyMessageRabbitMq<T> {
	correlationId?: string;
	success: boolean;
	data?: T;
	message?: string; // Optional message for success or error
	error?: string;
	traceId?: string;
	timestamp?: string; // ISO 8601 format
	statusCode?: StatusCodes;
}

export type WorkerRabbitMq = () => Promise<void>;
