import { Processor, Queue, Worker, ConnectionOptions, QueueEvents, Job } from 'bullmq';
import { randomUUID, UUID } from 'crypto';
import { TriggerJobMessageBullMq, TriggerJobOptions } from '../../types';

export class TriggerJobBullMq {
	private readonly _connection: ConnectionOptions;
	private _queues: Queue<any, any, string, any, any, string> | null = null;

	public constructor(connection: ConnectionOptions) {
		this._connection = connection;
	}

	public setQueues(queueName: string) {
		if (!queueName) throw new Error('Queue name must be provided');

		this._queues = new Queue(queueName, {
			connection: this._connection,
			defaultJobOptions: {
				removeOnComplete: true,
				removeOnFail: true,
				attempts: 3,
				backoff: {
					type: 'exponential',
					delay: 1000,
				},
			},
		});
	}

	public async triggerAsync<T>(
		jobName: string,
		jobOptions: TriggerJobOptions,
		data: TriggerJobMessageBullMq<T>
	) {
		if (!this._queues) throw new Error('Queues not initialized');

		if (!jobName) throw new Error('Job name must be provided');

		if (!jobOptions) throw new Error('Job id must be provided');

		if (!data) throw new Error('Data must be provided');

		const { jobId, delay, priority, repeat } = jobOptions;

		const job = await this._queues.add(jobName, data, {
			jobId: jobId ?? randomUUID(),
			delay: delay ?? 1000,
			priority: priority ?? undefined,
			removeOnComplete: true,
			...(repeat && {
				repeat: {
					pattern: repeat.cornPattern,
					limit: repeat.limit,
				},
			}),
		});

		return job;
	}

	public async removeJobByIdAsync(jobId: UUID) {
		if (!this._queues) throw new Error('Queues not initialized');

		if (!jobId) throw new Error('Job id must be provided');

		return await this._queues.remove(jobId);
	}

	public async closeAsync(): Promise<void> {
		if (this._queues) {
			await this._queues.close();
			this._queues = null;
		}
	}
}
