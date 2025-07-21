import winston from 'winston';
import { DataResponse } from '../../../../models/response/data.Response';
import { PipelineWorkflowException } from '../exception';
import { StatusCodes } from 'http-status-codes';
import { Result } from 'neverthrow';
import { ResultError } from '../../../exceptions/results';
import { isVoidResult } from '../../../miscellaneous/voidResult';

export type StepDefinition<T> = {
	name: string;
	action: () => Promise<Result<T, ResultError>>;
};

export function defineParallelSteps<T extends readonly StepDefinition<any>[]>(...steps: T): T {
	return steps;
}

export function defineParallelStep<T>(
	name: string,
	action: () => Promise<Result<T, ResultError>>
): StepDefinition<T> {
	return { name, action };
}

export class PipelineWorkflow {
	private readonly _logger: winston.Logger;
	private readonly _context = new Map<string, any>();

	public constructor(logger: winston.Logger) {
		this._logger = logger;
	}

	public async step<TResult>(
		name: string,
		action: () => Promise<Result<TResult, ResultError>>
	): Promise<TResult> {
		try {
			this._logger.info(`[Pipeline Step:START] step name: ${name}`);
			const result = await action();

			if (result.isOk()) {
				const value = result.value;

				if (isVoidResult(value)) {
					this._logger.info(`[Pipeline Step:OK] step name: ${name}`);
					return value;
				}

				if (!value)
					throw new PipelineWorkflowException(
						name,
						false,
						StatusCodes.NO_CONTENT,
						`No result found for step ${name}`
					);

				this._context?.set(name, value);
				this._logger.info(`[Pipeline Step:OK] step name: ${name}`);
				return value;
			} else {
				throw new PipelineWorkflowException(
					name,
					false,
					result.error.statusCode,
					result.error.message,
					result.error.stackTrace
				);
			}
		} catch (ex) {
			const error = ex as Error | PipelineWorkflowException;
			this._logger.error(
				`[Pipeline Step:ERROR] step name: ${name ?? error?.name} || error message: ${error.message} || error stack trace: ${error?.stack}`
			);
			throw error;
		}
	}

	public async stepParallel<
		TSteps extends readonly {
			name: string;
			action: () => Promise<Result<any, ResultError>>;
		}[],
	>(
		steps: TSteps
	): Promise<{
		[K in keyof TSteps]: TSteps[K] extends {
			action: () => Promise<Result<infer R, ResultError>>;
		}
			? R
			: never;
	}> {
		if (!Array.isArray(steps) || steps.length === 0) {
			throw new PipelineWorkflowException(
				`non-step`,
				false,
				StatusCodes.BAD_REQUEST,
				'Steps must be a non-empty array'
			);
		}
		try {
			this._logger.info(`[Pipeline Parallel:START] Running ${steps.length} steps`);

			const results = await Promise.all(
				steps.map(async ({ name, action }) => {
					return await this.step(name, action);
				})
			);

			this._logger.info(`[Pipeline Parallel:COMPLETE]`);
			return results as any;
		} catch (ex) {
			const error = ex as Error | PipelineWorkflowException;
			this._logger.error(
				`[Pipeline Step:ERROR] step name: ${error?.name} || error message: ${error.message} || error stack trace: ${error?.stack}`
			);
			throw error;
		}
	}

	public async ifElseStep<TResult>(
		name: string,
		condition: (context: Map<string, any>) => boolean,
		ifAction: () => Promise<Result<TResult, ResultError>>,
		elseAction: () => Promise<Result<TResult, ResultError>>
	): Promise<TResult> {
		try {
			const branch = condition(this._context) ? 'IF' : 'ELSE';
			this._logger.info(
				`[Pipeline IfElse Step:EVALUATE] step name: ${name} || branch: ${branch}`
			);

			const result = await this.step(`${name}_${branch}`, () =>
				condition(this._context) ? ifAction() : elseAction()
			);

			return result;
		} catch (ex) {
			const error = ex as Error | PipelineWorkflowException;
			this._logger.error(
				`[Pipeline Step:ERROR] step name: ${name ?? error?.name} || error message: ${error.message} || error stack trace: ${error?.stack}`
			);
			throw error;
		}
	}

	public getResult<TResult>(name: string): TResult {
		try {
			if (!this._context.has(name)) {
				throw new PipelineWorkflowException(
					name,
					false,
					StatusCodes.INTERNAL_SERVER_ERROR,
					`Step ${name} not found`
				);
			}

			return this?._context?.get(name) as TResult;
		} catch (ex) {
			const error = ex as Error | PipelineWorkflowException;
			this._logger.error(
				`[Pipeline Step:ERROR] step name: ${name ?? error?.name} || error message: ${error.message} || error stack trace: ${error?.stack}`
			);
			throw error;
		}
	}
}
