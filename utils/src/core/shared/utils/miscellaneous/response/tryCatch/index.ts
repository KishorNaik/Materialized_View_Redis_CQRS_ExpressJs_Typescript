import { StatusCodes } from 'http-status-codes';
import { Result } from 'neverthrow';
import { ResultError } from '../../../exceptions/results';
import { ResultFactory } from '../result';

export const tryCatchResultAsync = async <T>(
	onTry: () => Promise<Result<T, ResultError>>
): Promise<Result<T, ResultError>> => {
	try {
		if (!onTry) return ResultFactory.error(StatusCodes.BAD_REQUEST, 'Action is required');
		const result = await onTry();
		return result;
	} catch (ex) {
		const error = ex as Error;
		return ResultFactory.error(
			StatusCodes.INTERNAL_SERVER_ERROR,
			error.message,
			undefined,
			error.stack
		);
	}
};

interface ITryCatchSagaOptions<T> {
	onTry: () => Promise<Result<T, ResultError>>;
	onFallback?: (error: ResultError) => Promise<Result<T, ResultError>>;
	onFinally?: () => void | Promise<void>;
}

export const tryCatchSagaAsync = async <T>(
	params: ITryCatchSagaOptions<T>
): Promise<Result<T, ResultError>> => {
	const { onTry, onFallback, onFinally } = params;
	try {
		if (!onTry) return ResultFactory.error(StatusCodes.BAD_REQUEST, 'Action is required');

		const result = await onTry();

		// If the result itself is an error and we have a fallback
		if (result.isErr() && onFallback) {
			return await onFallback(result.error);
		}
		return result;
	} catch (ex) {
		const error = ex as Error;
		const resultError = ResultFactory.error<T>(
			StatusCodes.INTERNAL_SERVER_ERROR,
			error.message,
			undefined,
			error.stack
		);

		// Try fallback on exception
		if (onFallback && resultError.isErr()) {
			return await onFallback(resultError.error);
		}

		return ResultFactory.errorInstance<T>(resultError);
	} finally {
		if (onFinally) {
			await onFinally();
		}
	}
};
