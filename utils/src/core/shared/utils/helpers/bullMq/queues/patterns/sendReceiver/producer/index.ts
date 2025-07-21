import { Processor, Queue, Worker, ConnectionOptions, QueueEvents, Job } from 'bullmq';
import { SendReceiverMessageBullMq } from '../../../../types';
import { randomUUID } from 'node:crypto';

export class SenderReceiverProducerBullMq {
	private readonly _connection: ConnectionOptions;
	private _queues: Queue<any, any, string, any, any, string> | null = null;

	public constructor(connection: ConnectionOptions) {
		this._connection = connection;
	}

	public setQueues(queueName: string) {
		if (!queueName) throw new Error('Queue name must be provided');

		this._queues = new Queue(queueName, {
			connection: this._connection,
		});
		return this;
	}

	public async sendAsync<T>(jobName: string, data: SendReceiverMessageBullMq<T>): Promise<void> {
		if (!this._queues) throw new Error('Queues not initialized');

		if (!jobName) throw new Error('Job name must be provided');

		if (!data) throw new Error('Data must be provided');

		if (!this._connection) throw new Error('Connection must be provided');

		await this._queues.add(jobName, data, {
			jobId: randomUUID().toString(),
			removeOnComplete: true,
			removeOnFail: true,
			attempts: 3,
		});
	}
	public async closeAsync(): Promise<void> {
		if (this._queues) {
			await this._queues.close();
			this._queues = null;
		}
	}
}
