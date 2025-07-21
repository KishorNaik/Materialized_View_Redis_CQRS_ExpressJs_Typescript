import { dbDataSource } from '../../../../config/dbSource';
import {
	Container,
	DtoValidation,
	Err,
	IDtoValidation,
	Ok,
	QueryRunner,
	Result,
	ResultError,
	Service,
	StatusCodes,
} from '@kishornaik/utils';

export interface IAddService<TInput, TOutput> {
	handleAsync(
		params: TInput,
		queryRunner?: QueryRunner
	): Promise<Result<TOutput | null, ResultError>>;
}

@Service()
export class AddService<T extends object> implements IAddService<T, T> {
	private readonly dtoValidation: IDtoValidation<T>;

	public constructor(entity: new () => T) {
		this.entity = entity;
		this.dtoValidation = Container.get(DtoValidation<T>);
	}

	private entity: new () => T;

	public async handleAsync(
		params: T,
		queryRunner?: QueryRunner
	): Promise<Result<T | null, ResultError>> {
		try {
			if ('identifier' in (params as any) === false)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'Identifier is required'));
			//logger.info(`identifier: ${(params as any).identifier}`);

			if ('status' in (params as any) === false)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'Status is required'));
			//logger.info(`status: ${(params as any).status}`);

			//logger.info(`Params: ${JSON.stringify(params)}`);

			// Validate Entity
			const validationResult = await this.dtoValidation.handleAsync({
				dto: params,
				dtoClass: (params as any).constructor,
			});
			if (validationResult.isErr()) return new Err(validationResult.error);

			// Run Query Runner
			const entityManager = queryRunner ? queryRunner.manager : dbDataSource.manager;

			// Insert Query
			const result = await entityManager
				.createQueryBuilder()
				.insert()
				.into(this.entity)
				.values(params!)
				.execute();

			// Check if insert is successfully
			if (!result.identifiers[0].id)
				return new Err(
					new ResultError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to insert entity')
				);

			// Get Entity
			return new Ok(params);
		} catch (ex) {
			const error = ex as Error;
			return new Err(new ResultError(StatusCodes.INTERNAL_SERVER_ERROR, error.message));
		}
	}
}
