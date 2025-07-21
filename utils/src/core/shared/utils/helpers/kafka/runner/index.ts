import { WorkerKafka } from '../types';

export class KafkaRunner {
	private _workers: WorkerKafka[] = [];

	public registerWorker(worker: WorkerKafka) {
		this._workers.push(worker);
	}

	public unregisterWorker(worker: WorkerKafka) {
		this._workers.splice(this._workers.indexOf(worker), 1);
	}

	public get count(): number {
		return this._workers?.length ?? 0;
	}

	// Run workers
	public async runWorkers() {
		await Promise.all(this._workers.map((worker) => worker()));
	}
}
