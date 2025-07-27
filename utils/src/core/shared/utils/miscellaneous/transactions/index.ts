import { QueryRunner } from 'typeorm';
import { DataResponseFactory, ResultFactory } from '../response';
import { StatusCodes } from 'http-status-codes';
import { DataResponse } from '../../../models/response/data.Response';
import { Result } from 'neverthrow';
import { ResultError } from '../../exceptions/results';

export namespace TransactionsWrapper {
	export interface ITransactionDataResponseOptions<TResponse> {
		queryRunner: QueryRunner;
		onTransaction: () => Promise<DataResponse<TResponse>>;
	}

	export const runDataResponseAsync = async <TResponse>(
		params: ITransactionDataResponseOptions<TResponse>
	): Promise<DataResponse<TResponse>> => {
		if (!params)
			return DataResponseFactory.error(
				StatusCodes.BAD_REQUEST,
				`transaction params is required`
			);

		if (!params.queryRunner)
			return DataResponseFactory.error(StatusCodes.BAD_REQUEST, `queryRunner is required`);

		if (!params.onTransaction)
			return DataResponseFactory.error(
				StatusCodes.BAD_REQUEST,
				`onTransaction body is required`
			);

		const { queryRunner, onTransaction } = params;

		try {
			await queryRunner.startTransaction();
			const response = await onTransaction();
			await queryRunner.commitTransaction();

			return response;
		} catch (ex) {
			const error = ex as Error;
			return await DataResponseFactory.pipelineError<TResponse>(error, queryRunner);
		} finally {
			await queryRunner.release();
		}
	};

	export interface ITransactionResultOptions<TResponse> {
		queryRunner: QueryRunner;
		onTransaction: () => Promise<Result<TResponse, ResultError>>;
	}

	export const runResultAsync = async <TResponse>(
		params: ITransactionResultOptions<TResponse>
	): Promise<Result<TResponse, ResultError>> => {
		if (!params)
			return ResultFactory.error(StatusCodes.BAD_REQUEST, `transaction params is required`);

		if (!params.queryRunner)
			return ResultFactory.error(StatusCodes.BAD_REQUEST, `queryRunner is required`);

		if (!params.onTransaction)
			return ResultFactory.error(StatusCodes.BAD_REQUEST, `onTransaction body is required`);

		const { queryRunner, onTransaction } = params;

		try {
			await queryRunner.startTransaction();
			const response = await onTransaction();
			if (response.isErr()) {
				await queryRunner.rollbackTransaction();
				return response;
			}

			await queryRunner.commitTransaction();

			return response;
		} catch (ex) {
			const error = ex as Error;
			await queryRunner.rollbackTransaction();
			return ResultFactory.error<TResponse>(
				StatusCodes.INTERNAL_SERVER_ERROR,
				error.message,
				undefined,
				error.stack
			);
		} finally {
			await queryRunner.release();
		}
	};
}
