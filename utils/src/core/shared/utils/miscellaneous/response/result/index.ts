import { StatusCodes } from 'http-status-codes';
import { Err, Ok, Result } from 'neverthrow';
import { ResultError } from '../../../exceptions/results';

export class ResultFactory {
	public static success<T>(data: T): Result<T, ResultError> {
		return new Ok(data);
	}

	public static error<T>(
		statusCode: StatusCodes,
		message: string,
		fallbackObject?: object,
		stackTrace?: string
	): Result<T, ResultError> {
		return new Err(new ResultError(statusCode, message, stackTrace, fallbackObject));
	}

	public static errorInstance<T>(
		resultError: ResultError | Result<T, ResultError>
	): Result<T, ResultError> {
		if (resultError instanceof ResultError) {
			return new Err(resultError);
		}
		return resultError;
	}
}
