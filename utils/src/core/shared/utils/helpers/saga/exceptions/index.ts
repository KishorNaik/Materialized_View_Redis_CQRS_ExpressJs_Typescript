import { StatusCodes } from 'http-status-codes';

export class SagaExecutionException extends Error {
	private readonly _stepName: string;
	private readonly _statusCode: StatusCodes;
	private readonly _isCompensated: boolean;
	private readonly _stack?: string;

	constructor(
		stepName: string,
		statusCode: StatusCodes,
		message: string,
		isCompensated: boolean,
		stack?: string
	) {
		super(message);
		this._stepName = stepName;
		this._statusCode = statusCode;
		this._isCompensated = isCompensated;

		if (stack) {
			Object.defineProperty(this, 'stack', {
				value: stack,
				writable: false,
				configurable: true,
			});
		} else {
			Error.captureStackTrace(this, SagaExecutionException);
		}
	}

	public get stepName(): string {
		return this._stepName;
	}

	public get statusCode(): StatusCodes {
		return this._statusCode;
	}

	public get isCompensated(): boolean {
		return this._isCompensated;
	}

	public override get stack(): string | undefined {
		return this._stack ?? super.stack;
	}
}
