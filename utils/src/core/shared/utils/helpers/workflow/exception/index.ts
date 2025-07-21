import { StatusCodes } from 'http-status-codes';

export class PipelineWorkflowException extends Error {
	private readonly _stepName: string;
	private readonly _statusCode: StatusCodes;
	private readonly _success: boolean;
	//private readonly _stack?: string | undefined;

	constructor(
		stepName: string,
		success: boolean,
		statusCode: StatusCodes,
		message: string,
		stack?: string | undefined
	) {
		super(message);
		this._stepName = stepName;
		this._success = success;
		this._statusCode = statusCode;
		// Preserve original stack trace if provided
		if (stack) {
			Object.defineProperty(this, 'stack', {
				value: stack,
				writable: false,
				configurable: true,
			});
		} else {
			// Fallback to native stack generation
			Error.captureStackTrace(this, PipelineWorkflowException);
		}
	}

	public get statusCode(): StatusCodes {
		return this._statusCode;
	}

	public get success(): boolean {
		return this._success;
	}

	public override get stack(): string | undefined {
		return super.stack;
	}

	public get stepName(): string {
		return this._stepName;
	}
}
