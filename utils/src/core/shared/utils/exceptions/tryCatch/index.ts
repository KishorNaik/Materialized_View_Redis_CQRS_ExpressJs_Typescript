import { StatusCodes } from 'http-status-codes';
import { Result } from 'neverthrow';
import { ResultError } from '../results';
import { ResultFactory } from '../../miscellaneous/response/result';
import { DataResponse } from '../../../models/response/data.Response';
import { DataResponseFactory } from '../../miscellaneous/response/data';
import { PipelineWorkflowException } from '../../helpers/workflow';

export namespace ExceptionsWrapper {
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

	export interface ITryCatchSagaResultOptions<T> {
		onTry: () => Promise<Result<T, ResultError>>;
		onFallback?: (error: ResultError) => Promise<Result<T, ResultError>>;
		onFinally?: () => void | Promise<void>;
	}

	export const tryCatchSagaResultAsync = async <T>(
		params: ITryCatchSagaResultOptions<T>
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

	export const tryCatchPipelineAsync = async <T>(
		onTry: () => Promise<DataResponse<T>>
	): Promise<DataResponse<T>> => {
		try {
			if (!onTry)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Action is required');
			const result = await onTry();
			return result;
		} catch (ex) {
			const error = ex as Error;
			return await DataResponseFactory.pipelineError<T>(error);
		}
	};

	export interface ITryCatchSagaPipelineOptions<T> {
		onTry: () => Promise<DataResponse<T>>;
		onFallback?: (response?: DataResponse<T>) => Promise<DataResponse<T>>;
		onFinally?: () => void | Promise<void>;
	}

	export const tryCatchSagaPipelineAsync = async <T>(
		params: ITryCatchSagaPipelineOptions<T>
	): Promise<DataResponse<T>> => {
		const { onTry, onFallback, onFinally } = params;
		try {
			if (!onTry)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Action is required');

			const result = await onTry();

			// If the result itself is an error and we have a fallback
			if (!result.Success && onFallback) {
				return await onFallback(result);
			}
			return result;
		} catch (ex) {
			const error = ex as Error;
			const responseError = await DataResponseFactory.pipelineError<T>(error);
			// Try fallback on exception
			if (onFallback) {
				return await onFallback(responseError);
			}
			return responseError;
		} finally {
			if (onFinally) {
				await onFinally();
			}
		}
	};
}
