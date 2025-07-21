import { HttpError } from 'routing-controllers';
import { DataResponse, DataResponseFactory, StatusCodes } from '@kishornaik/utils';

export class HttpException extends HttpError {
	public status: number;
	public message: string;

	constructor(status: number, message: string) {
		super(status, message);
		this.status = status;
		this.message = message;
	}
}

export class HttpExceptionFactory {
	public static error<TResult>(
		errorMessage: string,
		statusCode: StatusCodes
	): DataResponse<TResult> {
		return DataResponseFactory.response<TResult>(false, statusCode, undefined, errorMessage);
	}
}

/**
 * @deprecated QueryException is deprecated. Use HttpExceptionFactory.error instead.
 */
export class QueryException {
	public static queryError<TResult>(
		errorMessage: string,
		statusCode: StatusCodes
	): DataResponse<TResult> {
		return DataResponseFactory.response<TResult>(false, statusCode, undefined, errorMessage);
	}
}

/**
 * @deprecated CommandException is deprecated. Use DataResponseFactory.Response instead.
 */
export class CommandException {
	public static commandError<TResult>(
		errorMessage: string,
		statusCode: StatusCodes
	): DataResponse<TResult> {
		return DataResponseFactory.response<TResult>(false, statusCode, undefined, errorMessage);
	}
}
