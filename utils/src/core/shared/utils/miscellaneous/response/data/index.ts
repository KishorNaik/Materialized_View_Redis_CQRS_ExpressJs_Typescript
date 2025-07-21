import { StatusCodes } from 'http-status-codes';
import {
	DataResponse,
	PaginationDataResponseModel,
} from '../../../../models/response/data.Response';
import { PipelineWorkflowException } from '../../../helpers/workflow';
import { QueryRunner } from 'typeorm';

export class DataResponseFactory {
	static response<TData>(
		success?: boolean,
		statusCode?: StatusCodes,
		data?: TData,
		message?: string,
		pagination?: PaginationDataResponseModel
	): DataResponse<TData> {
		return {
			Success: success,
			StatusCode: statusCode,
			Data: data,
			Message: message,
			Pagination: pagination,
		};
	}

	public static success<TData>(
		statusCode?: StatusCodes,
		data?: TData,
		message?: string,
		pagination?: PaginationDataResponseModel
	): DataResponse<TData> {
		return {
			Success: true,
			StatusCode: statusCode,
			Data: data,
			Message: message,
			Pagination: pagination,
		};
	}

	public static error<TData>(
		statusCode?: StatusCodes,
		message?: string,
		pagination?: PaginationDataResponseModel
	): DataResponse<TData> {
		return {
			Success: false,
			StatusCode: statusCode,
			Data: undefined,
			Message: message,
			Pagination: pagination,
		};
	}

	public static async pipelineError<TData>(
		error: Error | PipelineWorkflowException,
		queryRunner?: QueryRunner
	): Promise<DataResponse<TData>> {
		if (queryRunner?.isTransactionActive) {
			console.log(`queryRunner.isTransactionActive: ${queryRunner.isTransactionActive}`);
			await queryRunner.rollbackTransaction();
		}

		if (error instanceof PipelineWorkflowException)
			return DataResponseFactory.error(error.statusCode, error.message);

		return DataResponseFactory.error(
			StatusCodes.INTERNAL_SERVER_ERROR,
			error.message ?? 'Unexpected error'
		);
	}
}
