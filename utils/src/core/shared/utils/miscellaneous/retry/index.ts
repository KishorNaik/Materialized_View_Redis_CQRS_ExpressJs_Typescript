import { Result } from 'neverthrow';
import { ResultError } from '../../exceptions/results';
import { ResultFactory } from '../response';
import { StatusCodes } from 'http-status-codes';

export namespace Retry {
	export interface RetryOptions<T, TArgs extends any[]> {
		fn: (...args: TArgs) => Promise<Result<T, ResultError>>;
		args: TArgs;
		maxRetry: number;
		delay?: number; // milliseconds
	}

	export async function runAsync<T, TArgs extends any[]>(
		params: RetryOptions<T, TArgs>
	): Promise<Result<T, ResultError>> {
		const { fn, args, maxRetry, delay = 0 } = params;

		for (let attempt = 1; attempt <= maxRetry; attempt++) {
			try {
				const result = await fn(...args);
				if (result.isOk()) return result;

				if (attempt < maxRetry && delay > 0) {
					await new Promise((res) => setTimeout(res, delay));
				}
			} catch (ex) {
				const error = ex as Error;
				return ResultFactory.error(
					StatusCodes.INTERNAL_SERVER_ERROR,
					`Unexpected error during retry operation:${error.message}`,
					undefined,
					error.stack
				);
			}
		}

		return ResultFactory.error(
			StatusCodes.REQUEST_TIMEOUT,
			`Operation failed after ${maxRetry} retries`
		);
	}
}

/*
Example:
const unstableTask = async (name: string): Promise<Result<string, ResultError>> => {
  if (Math.random() < 0.6) {
    return ResultFactory.error(StatusCodes.SERVICE_UNAVAILABLE, `${name} failed`);
  }
  return ResultFactory.success(`Hello, ${name}!`);
};

(async () => {
  const result = await Retry.runAsync({
    fn: unstableTask,
    args: ['Kishor'],
    maxRetry: 5,
    delay: 1000
  });

  if (result.isOk()) {
    console.log('✅ Success:', result.value);
  } else {
    console.error('❌ Failure:', result.error.message);
  }
})();
*/
