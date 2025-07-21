import { WorkerBullMq } from '../types';

export class BullMqRunner {
	private _workers: WorkerBullMq[] = [];

	public registerWorker(worker: WorkerBullMq) {
		this._workers.push(worker);
	}

	public unregisterWorker(worker: WorkerBullMq) {
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
