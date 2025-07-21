import { WorkerPusher } from '../types';

export class PusherRunner {
	private _workers: WorkerPusher[] = [];

	public registerWorker(worker: WorkerPusher) {
		this._workers.push(worker);
	}

	public unregisterWorker(worker: WorkerPusher) {
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
