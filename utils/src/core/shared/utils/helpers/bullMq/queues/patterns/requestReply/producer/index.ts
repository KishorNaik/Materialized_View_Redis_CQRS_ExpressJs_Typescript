import { Processor, Queue, Worker, ConnectionOptions, QueueEvents, Job } from 'bullmq';
import {
	ReplyMessageBullMq,
	RequestReplyMessageBullMq,
	SendReceiverMessageBullMq,
} from '../../../../types';
import { randomUUID } from 'node:crypto';

export class RequestReplyProducerBullMq {
	private readonly _connection: ConnectionOptions;
	private _queues: Queue<any, any, string, any, any, string> | null = null;
	private _queueName: string | null = null;
	private _queueEvents: QueueEvents | null = null;

	public constructor(connection: ConnectionOptions) {
		this._connection = connection;
	}

	public setQueues(queueName: string) {
		if (!queueName) throw new Error('Queue name must be provided');

		this._queues = new Queue(queueName, {
			connection: this._connection,
		});

		this._queueName = queueName;
		return this;
	}

	public setQueueEvents() {
		if (!this._queueName) throw new Error('Queue name must be provided');

		this._queueEvents = new QueueEvents(this._queueName, {
			connection: this._connection,
		});
		return this;
	}

	public async sendAsync<TRequest, TResponse>(
		jobName: string,
		data: RequestReplyMessageBullMq<TRequest>
	): Promise<ReplyMessageBullMq<TResponse>> {
		if (!this._queues) throw new Error('Queues not initialized');

		if (!jobName) throw new Error('Job name must be provided');

		if (!data) throw new Error('Data must be provided');

		if (!this._connection) throw new Error('Connection must be provided');

		if (!this._queueName) throw new Error('Queue name must be provided');

		if (!this._queueEvents) throw new Error('Queue events must be provided');

		const job = await this._queues.add(jobName, data, {
			jobId: randomUUID().toString(),
			removeOnComplete: true,
			removeOnFail: true,
			attempts: 3,
		});

		if (!job) throw new Error('Job could not be created');
		const jobResult = await job.waitUntilFinished(this._queueEvents!);
		return jobResult as ReplyMessageBullMq<TResponse>;
	}
	public async closeAsync(): Promise<void> {
		if (this._queues) {
			await this._queues.close();
			this._queues = null;
		}
	}
}
