import { Processor, Queue, Worker, ConnectionOptions, QueueEvents, Job } from 'bullmq';
import {
	ReplyMessageBullMq,
	RequestReplyMessageBullMq,
	SendReceiverMessageBullMq,
} from '../../../../types';

export class RequestReplyConsumerBullMq {
	private readonly _connection: ConnectionOptions;

	public constructor(connection: ConnectionOptions) {
		this._connection = connection;
	}

	public async startConsumingAsync<TRequest, TResponse>(
		queueName: string,
		job?:
			| string
			| URL
			| Processor<RequestReplyMessageBullMq<TRequest>, ReplyMessageBullMq<TResponse>, string>
	): Promise<Worker<RequestReplyMessageBullMq<TRequest>, ReplyMessageBullMq<TResponse>, string>> {
		return new Promise<Worker<any, any, string>>(async (resolve, reject) => {
			try {
				if (!queueName) throw new Error('Queue name and job processor must be provided');

				if (!this._connection) throw new Error('Connection must be provided');

				const worker = new Worker(queueName, job, {
					connection: this._connection,
					removeOnFail: { count: 0 },
					lockDuration: 20 * 60 * 1000,
					concurrency: 10,
				});
				return resolve(worker);
			} catch (ex) {
				reject(ex);
			}
		});
	}
}
