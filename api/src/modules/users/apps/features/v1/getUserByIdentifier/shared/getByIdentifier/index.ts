import {
	RequestData,
	sealed,
	StatusCodes,
	DataResponse as ApiDataResponse,
	requestHandler,
	RequestHandler,
	DataResponseFactory,
	PipelineWorkflowException,
	PipelineWorkflow,
	Container,
  DataResponse,
  TransactionsWrapper,
  GuardWrapper,
  ResultFactory,
} from '@kishornaik/utils';
import { getQueryRunner, UserEntity } from '@kishornaik/db';
import { GetUserByIdentifierRequestDto, GetUserByIdentifierResponseDto } from '../../contracts';
import { logger } from '@/shared/utils/helpers/loggers';
import { GetUserByValidationService } from './services/validations';
import { GetUserByIdentifierMapEntityService } from './services/mapEntity';
import { GetUserByIdentifierCacheService } from './services/cache';
import { NODE_ENV } from '@/config/env';
import { GetUserByIdentifierResponseMapService } from './services/mapResponse';
// #region Query
@sealed
export class GetUserByIdentifierWrapperQuery extends RequestData<DataResponse<GetUserByIdentifierResponseDto>>{
  private readonly _request: GetUserByIdentifierRequestDto
  public constructor(request: GetUserByIdentifierRequestDto) {
    super();
    this._request = request;
  }

  public get request(): GetUserByIdentifierRequestDto {
    return this._request;
  }
}
//#endregion

enum pipelineSteps{
  ValidationService="ValidationService",
  MapEntityService="MapEntityService",
  CacheService="CacheService",
  MapResponseService="MapResponseService"
}

// #region Query Handler
@sealed
@requestHandler(GetUserByIdentifierWrapperQuery)
export class GetUserByIdentifierWrapperQueryHandler implements RequestHandler<GetUserByIdentifierWrapperQuery,DataResponse<GetUserByIdentifierResponseDto>>{

  private pipeline=new PipelineWorkflow(logger);
  private readonly _getUserByValidationService:GetUserByValidationService;
  private readonly _getUserByIdentifierMapEntityService:GetUserByIdentifierMapEntityService;
  private readonly _getUserByIdentifierCacheService:GetUserByIdentifierCacheService;
  private readonly _getUserByIdentifierResponseMapService:GetUserByIdentifierResponseMapService;

  public constructor(){
    this._getUserByValidationService=Container.get(GetUserByValidationService);
    this._getUserByIdentifierMapEntityService=Container.get(GetUserByIdentifierMapEntityService);
    this._getUserByIdentifierCacheService=Container.get(GetUserByIdentifierCacheService);
    this._getUserByIdentifierResponseMapService=Container.get(GetUserByIdentifierResponseMapService);
  }

  public async handle(value: GetUserByIdentifierWrapperQuery): Promise<DataResponse<GetUserByIdentifierResponseDto>> {
    const queryRunner = getQueryRunner();
		await queryRunner.connect();
    return await TransactionsWrapper.runDataResponseAsync({
      queryRunner:queryRunner,
      onTransaction:async ()=>{

        const {request}=value;

        // Guard
        const guardResult = new GuardWrapper()
          .check(value, 'value')
          .check(request, 'request')
          .validate();
        if (guardResult.isErr())
          return DataResponseFactory.error(
            guardResult.error.statusCode,
            guardResult.error.message
          );

        //Validation
        await this.pipeline.step(pipelineSteps.ValidationService, async () => {
          return await this._getUserByValidationService.handleAsync({
            dto: request,
            dtoClass: GetUserByIdentifierRequestDto
          });
        });

        // Map Entity
        await this.pipeline.step(pipelineSteps.MapEntityService,async ()=>{
          return await this._getUserByIdentifierMapEntityService.handleAsync({
            id:request.id
          });
        });

        // Cache
        await this.pipeline.step(pipelineSteps.CacheService,async ()=>{

          // Get Map Entity Result
          const mapResult=this.pipeline.getResult<UserEntity>(pipelineSteps.MapEntityService);

          const cacheResult=await this._getUserByIdentifierCacheService.handleAsync({
            env:NODE_ENV!,
            key:`user-${mapResult.identifier}`,
            setParams:{
              queryRunner:queryRunner,
              user:mapResult
            }
          });

          if(cacheResult.isErr()){
            if(cacheResult.error.fallbackObject)
              return ResultFactory.success(cacheResult.error.fallbackObject as UserEntity);
            return ResultFactory.error(cacheResult.error.statusCode,cacheResult.error.message);
          }
          return ResultFactory.success(cacheResult.value);
        })


        // Map Response
        await this.pipeline.step(pipelineSteps.MapResponseService,async ()=>{
          const cacheResult=this.pipeline.getResult<UserEntity>(pipelineSteps.CacheService);
          return await this._getUserByIdentifierResponseMapService.handleAsync(cacheResult);
        });

        // Return
        const response=this.pipeline.getResult<GetUserByIdentifierResponseDto>(pipelineSteps.MapResponseService);
        return DataResponseFactory.success(StatusCodes.OK,response);

      }
    })
  }

}
//#endregion
