import { WorkerCronJob } from '../types';

export class CronJobRunner {
	private _workers: WorkerCronJob[] = [];

	public registerWorker(worker: WorkerCronJob) {
		this._workers.push(worker);
	}

	public unregisterWorker(worker: WorkerCronJob) {
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
