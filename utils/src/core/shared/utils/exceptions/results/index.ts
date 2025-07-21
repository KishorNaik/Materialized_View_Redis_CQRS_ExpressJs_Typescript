import { Err, Result } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';

export class ResultError {
	constructor(
		public statusCode: StatusCodes,
		public message: string,
		public stackTrace?: string,
		public fallbackObject?: object
	) {}
}
