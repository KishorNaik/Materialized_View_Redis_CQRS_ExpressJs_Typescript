// TaskRunnerService.ts
import workerpool, { Pool } from 'workerpool';

type TaskFn<T = unknown> = (...args: any[]) => T | Promise<T>;

interface TaskOptions {
	module?: string;
	timeoutMs?: number;
	retries?: number;
	traceId?: string;
}

export class TaskWorkerThread {
	private static pools: Map<string, Pool> = new Map();
	private static registry: Map<string, TaskFn<any>> = new Map();

	private static getPool(module: string): Pool {
		if (!this.pools.has(module)) {
			this.pools.set(module, workerpool.pool());
		}
		return this.pools.get(module)!;
	}

	public static registerTask<T>(name: string, fn: TaskFn<T>): void {
		this.registry.set(name, fn);
	}

	public static getTask<T>(name: string): TaskFn<T> {
		const task = this.registry.get(name);
		if (!task) throw new Error(`Task "${name}" not found`);
		return task;
	}

	public static async runTask<T>(
		name: string,
		args: any[],
		options: TaskOptions = {}
	): Promise<T> {
		const {
			module = 'default',
			timeoutMs = 3000,
			retries = 2,
			traceId = `trace-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
		} = options;

		const fn = this.getTask(name);
		const pool = this.getPool(module);

		const tracedFn: TaskFn<T> = async (...args: any[]): Promise<T> => {
			console.log(`[${traceId}] [${module}] Task "${name}" started`);
			const result = await fn(...args);
			console.log(`[${traceId}] [${module}] Task "${name}" completed`);
			return result as T;
		};

		for (let attempt = 0; attempt <= retries; attempt++) {
			try {
				return await Promise.race([
					pool.exec(async (...args: any[]): Promise<T> => {
						console.log(`[${traceId}] [${module}] Task "${name}" started`);
						const result = await fn(...args);
						console.log(`[${traceId}] [${module}] Task "${name}" completed`);
						return result as T;
					}, args),
					new Promise<T>((_, reject) =>
						setTimeout(() => reject(new Error('Timeout')), timeoutMs)
					),
				]);
			} catch (error) {
				console.warn(`[${traceId}] [${module}] Attempt ${attempt + 1} failed: ${error}`);
				if (attempt === retries) throw error;
			}
		}

		throw new Error(`[${traceId}] [${module}] Task failed after retries`);
	}

	static async terminateAll(): Promise<void> {
		await Promise.all([...this.pools.values()].map((pool) => pool.terminate()));
		this.pools.clear();
	}
}

/*
Example

Task.registerTask<number>('add', (a: number, b: number) => a + b);
const value = await TaskRunnerService.runTask<number>('add', [2,2], {
  module: 'add',
  timeoutMs: 2000,
  retries: 1
});
*/
