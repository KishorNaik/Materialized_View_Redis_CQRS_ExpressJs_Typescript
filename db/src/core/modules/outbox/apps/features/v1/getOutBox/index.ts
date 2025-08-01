import {
	BoolEnum,
	Container,
	DtoValidation,
	Err,
	ExceptionsWrapper,
	IDtoValidation,
	In,
	IServiceHandlerAsync,
	IsSafeString,
	Ok,
	QueryRunner,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusCodes,
	StatusEnum,
} from '@kishornaik/utils';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { JobStatusEnum, OutboxEntity } from '../../../../outbox.Module';
import { dbDataSource } from '../../../../../../config/dbSource';

export class GetOutboxDbDto {
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public eventType?: string;

	@IsNotEmpty()
	@IsNumber()
	@Min(1)
	@Max(12)
	public take?: number = 12;

	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public instanceId?: string;
}

export interface IGetOutboxDbServiceParameters {
	request: GetOutboxDbDto;
	queryRunner: QueryRunner;
}

export interface IGetOutboxDbService
	extends IServiceHandlerAsync<IGetOutboxDbServiceParameters, Array<OutboxEntity>> {}

@sealed
@Service()
export class GetOutboxDbService implements IGetOutboxDbService {
	private readonly dtoValidation: IDtoValidation<GetOutboxDbDto>;

	public constructor() {
		this.dtoValidation = Container.get(DtoValidation<GetOutboxDbDto>);
	}

	public handleAsync(
		params: IGetOutboxDbServiceParameters
	): Promise<Result<OutboxEntity[], ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			// Guard
			if (!params)
				return ResultFactory.error(StatusCodes.BAD_REQUEST, 'Parameters are required');

			if (!params.queryRunner)
				return ResultFactory.error(StatusCodes.BAD_REQUEST, 'QueryRunner is required');

			if (!params.request)
				return ResultFactory.error(StatusCodes.BAD_REQUEST, 'Request is required');

			// Validate Entity
			const validationResult = await this.dtoValidation.handleAsync({
				dto: params.request,
				dtoClass: (params.request as any).constructor,
			});
			if (validationResult.isErr())
				return ResultFactory.error(StatusCodes.BAD_REQUEST, validationResult.error.message);

			const { queryRunner, request } = params;
			const { eventType, take, instanceId } = request;

			// Run Query Runner or Entity Manager
			const entityManger = queryRunner ? queryRunner.manager : dbDataSource.manager;

			// Query
			const claimableRows = await entityManger
				.createQueryBuilder(OutboxEntity, 'outbox')
				.where('outbox.eventType = :eventType', { eventType })
				.andWhere('outbox.jobStatus = :jobStatus', { jobStatus: JobStatusEnum.PENDING })
				.andWhere('outbox.isPublished = :isPublished', { isPublished: BoolEnum.NO })
				.andWhere('outbox.status = :status', { status: StatusEnum.ACTIVE })
				.andWhere('outbox.lockedBy IS NULL')
				.orderBy('outbox.created_date', 'ASC')
				.limit(take ?? 12)
				.getMany();

			if (!claimableRows || claimableRows.length === 0)
				return ResultFactory.error(StatusCodes.NOT_FOUND, 'No outbox found');

			// Update
			const ids = claimableRows.map((row) => row.id);
			await entityManger
				.createQueryBuilder()
				.update(OutboxEntity)
				.set({
					jobStatus: JobStatusEnum.PROCESSING,
					lockedBy: instanceId,
					lockedAt: new Date(),
				})
				.whereInIds(ids)
				.execute();

			// Get Updated Outbox
			const updatedOutboxList = await entityManger
				.createQueryBuilder(OutboxEntity, 'outbox')
				.where('outbox.id IN (:...ids)', { ids })
				.getMany();

			return ResultFactory.success(updatedOutboxList);
		});
	}
}
