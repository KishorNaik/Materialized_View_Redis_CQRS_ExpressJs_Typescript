import { Result } from 'neverthrow';
import { VoidResult } from '../voidResult';
import { ResultError } from '../../exceptions/results';

type RunMode = 'sequential' | 'parallel';

interface BatchArrayExecutionOptions<TInput, TOutput> {
	items: TInput[];
	handler: (item: TInput) => Promise<Result<TOutput | VoidResult, ResultError>>;
	batchSize?: number;
	concurrency?: number; // Max parallel tasks per batch (optional)
	runMode?: RunMode;
}

interface BatchArrayExecutionResult<TOutput> {
	success: Result<TOutput | VoidResult, ResultError>[];
	error: Result<TOutput | VoidResult, ResultError>[];
}

export async function executeBatchArrayAsync<TInput, TOutput>(
	options: BatchArrayExecutionOptions<TInput, TOutput>
): Promise<BatchArrayExecutionResult<TOutput>> {
	const {
		items,
		handler,
		batchSize = 10,
		concurrency = batchSize,
		runMode = 'parallel',
	} = options;

	const result: BatchArrayExecutionResult<TOutput> = {
		success: [],
		error: [],
	};

	if (items.length === 0) return result;

	const promises: Promise<Result<TOutput | VoidResult, ResultError>>[] = [];

	const processParallel = async () => {
		for (let i = 0; i < items.length; i += batchSize) {
			const batch = items.slice(i, i + batchSize);

			for (let j = 0; j < batch.length; j += concurrency) {
				const chunk = batch.slice(j, j + concurrency);
				for (const item of chunk) {
					promises.push(handler(item));
				}
			}

			await new Promise((res) => setImmediate(res)); // Yield after each batch
		}
	};

	const processSequential = async () => {
		for (let i = 0; i < items.length; i += batchSize) {
			const batch = items.slice(i, i + batchSize);

			for (const item of batch) {
				promises.push(handler(item));
				await new Promise((res) => setImmediate(res)); // Yield per item
			}

			// Optional yield after batch
			await new Promise((res) => setImmediate(res));
		}
	};

	if (runMode === 'parallel') {
		await processParallel();
	} else {
		await processSequential();
	}

	const resolved = await Promise.all(promises);

	for (const r of resolved) {
		r.isOk() ? result.success.push(r) : result.error.push(r);
	}

	return result;
}

/*
Example
await executeBatchArrayAsync({
  items: outboxList,
  handler: (outbox) =>
    service.handleAsync({ outbox, producer }),
  batchSize: 3,
  concurrency: 3, // Optional throttle
  runMode: 'parallel'
});


const result=await executeBatchArrayAsync({
  items: outboxList,
  handler: (outbox) =>
    service.handleAsync({ outbox, producer }),
  batchSize: 3,
  concurrency: 3, // Optional throttle
  runMode: 'parallel'
});

*/
