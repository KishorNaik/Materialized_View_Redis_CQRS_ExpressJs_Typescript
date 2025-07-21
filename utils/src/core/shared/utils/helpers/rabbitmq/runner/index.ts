import { WorkerRabbitMq } from '../types';

export class RabbitMqRunner {
	private _workers: WorkerRabbitMq[] = [];

	public registerWorker(worker: WorkerRabbitMq) {
		this._workers.push(worker);
	}

	public unregisterWorker(worker: WorkerRabbitMq) {
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
