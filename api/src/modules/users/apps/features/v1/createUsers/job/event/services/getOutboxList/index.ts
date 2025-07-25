import {
	GetOutboxDbDto,
	GetOutboxDbService,
	getQueryRunner,
	OutboxEntity,
	QueryRunner,
} from '@kishornaik/db';
import {
	ExceptionsWrapper,
	GuardWrapper,
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
} from '@kishornaik/utils';

export interface IOutboxListServiceParameters {
	eventType: string;
	instanceId: string;
	queryRunner: QueryRunner;
	getOutboxDbService: GetOutboxDbService;
}

export interface IGetOutboxListService
	extends IServiceHandlerAsync<IOutboxListServiceParameters, OutboxEntity[]> {}

@sealed
@Service()
export class GetOutboxListService implements IGetOutboxListService {
	public handleAsync(
		params: IOutboxListServiceParameters
	): Promise<Result<OutboxEntity[], ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			const { eventType, instanceId, queryRunner, getOutboxDbService: service } = params;

			// Guard
			const guardResult = new GuardWrapper()
				.check(params, 'params')
				.check(eventType, 'eventType')
				.check(queryRunner, 'queryRunner')
				.check(service, 'service')
				.check(instanceId, 'instanceId')
				.validate();
			if (guardResult.isErr())
				return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			// Map Dto
			const getOutboxDbDto = new GetOutboxDbDto();
			getOutboxDbDto.eventType = eventType;
			getOutboxDbDto.instanceId = instanceId;
			getOutboxDbDto.take = 12;

			// Call Service
			const result = await service.handleAsync({
				request: getOutboxDbDto,
				queryRunner: queryRunner,
			});
			if (result.isErr())
				return ResultFactory.error(result.error.statusCode, result.error.message);

			return ResultFactory.success(result.value);
		});
	}
}
