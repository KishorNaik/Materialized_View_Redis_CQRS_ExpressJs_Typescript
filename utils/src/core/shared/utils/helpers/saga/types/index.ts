import { Result } from 'neverthrow';
import { ResultError } from '../../../exceptions/results';

export interface ISagaContext<TContext> {
	isSuccess: boolean;
	context: TContext;
}

export interface SagaStep<TContext, TResult> {
	label: string;
	action: (ctx: ISagaContext<TContext>) => Promise<Result<TResult, ResultError>>;
	compensate: (ctx: ISagaContext<TContext>) => Promise<void>;
	onError?: (err: ResultError, ctx: ISagaContext<TContext>) => Promise<void>;
	retry?: number;
}
