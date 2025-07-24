import { QueryRunner } from 'typeorm';
import { DataResponseFactory } from '../response';
import { StatusCodes } from 'http-status-codes';
import { DataResponse } from '../../../models/response/data.Response';

export namespace TransactionsWrapper {
	export interface ITransactionOptions<TResponse> {
		queryRunner: QueryRunner;
		onTransaction: () => Promise<DataResponse<TResponse>>;
	}

	export const runAsync = async <TResponse>(
		params: ITransactionOptions<TResponse>
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
}
