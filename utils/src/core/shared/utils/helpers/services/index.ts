import { Result } from 'neverthrow';
import { ResultError } from '../../exceptions/results';
import { VoidResult } from '../../miscellaneous/voidResult';

export interface IServiceHandlerAsync<TParams, TResult> {
	handleAsync(params: TParams): Promise<Result<TResult, ResultError>>;
}

export interface IServiceHandlerNoParamsAsync<TResult> {
	handleAsync(): Promise<Result<TResult, ResultError>>;
}

export interface IServiceHandlerVoidAsync<TParams> {
	handleAsync(params: TParams): Promise<Result<VoidResult, ResultError>>;
}

export interface IServiceHandlerNoParamsVoidAsync {
	handleAsync(): Promise<Result<VoidResult, ResultError>>;
}

export interface IServiceHandler<TParams, TResult> {
	handle(params: TParams): Result<TResult, ResultError>;
}

export interface IServiceHandlerVoid<TParams> {
	handle(params: TParams): Result<VoidResult, ResultError>;
}

export interface IServiceHandlerNoParams<TResult> {
	handle(): Result<TResult, ResultError>;
}

export interface IServiceHandlerNoParamsVoid {
	handle(): Result<VoidResult, ResultError>;
}
