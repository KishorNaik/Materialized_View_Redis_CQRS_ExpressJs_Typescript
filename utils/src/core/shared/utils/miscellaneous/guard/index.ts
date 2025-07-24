import { Result } from 'neverthrow';
import { VOID_RESULT, VoidResult } from '../voidResult';
import { ResultError } from '../../exceptions/results';
import { ResultFactory } from '../response';
import { StatusCodes } from 'http-status-codes';

export class GuardWrapper {
	private values: { value: unknown; required: boolean; keyHint?: string }[] = [];

	constructor() {}

	public check(value: unknown, keyHint?: string): GuardWrapper {
		this.values.push({ value, required: true, keyHint });
		return this;
	}

	public optional(value: unknown, keyHint?: string): GuardWrapper {
		this.values.push({ value, required: false, keyHint });
		return this;
	}

	public validate(): Result<VoidResult, ResultError> {
		for (const { value, required, keyHint } of this.values) {
			const isMissing = value === undefined || value === null;
			const isInvalid = isMissing || value === '';

			const label = keyHint ? ` [${keyHint}]` : '';

			if (required && isInvalid) {
				return ResultFactory.error(
					StatusCodes.BAD_REQUEST,
					`Required value${label} is missing or invalid`
				);
			}

			if (!required && !isMissing && value === '') {
				return ResultFactory.error(
					StatusCodes.BAD_REQUEST,
					`Optional value${label} is present but invalid`
				);
			}
		}

		return ResultFactory.success(VOID_RESULT);
	}
}
