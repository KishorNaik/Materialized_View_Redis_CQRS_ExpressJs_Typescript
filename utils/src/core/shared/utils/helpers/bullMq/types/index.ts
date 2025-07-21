import { UUID } from 'crypto';
import { StatusCodes } from 'http-status-codes';

export interface SendReceiverMessageBullMq<T> {
	data: T;
	traceId?: string;
	correlationId?: string; // Optional correlation ID for tracking
	timestamp?: string;
}

export interface RequestReplyMessageBullMq<T> {
	data: T;
	traceId?: string;
	correlationId?: string; // Optional correlation ID for tracking
	timestamp?: string;
}

export interface ReplyMessageBullMq<T> {
	correlationId?: string;
	success: boolean;
	data?: T;
	message?: string; // Optional message for success or error
	error?: string;
	traceId?: string;
	timestamp?: string;
	statusCode?: StatusCodes;
}

export interface TriggerJobMessageBullMq<T> {
	data: T;
	traceId?: string;
	correlationId?: string;
	timestamp?: string;
}

export interface TriggerJobOptions {
	jobId: UUID;
	delay?: number | undefined;
	priority?: number | undefined;
	repeat?: {
		cornPattern?: string | undefined;
		limit?: number | undefined;
	};
}

export type WorkerBullMq = () => Promise<void>;
