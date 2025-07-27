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
  IServiceHandlerAsync,
  Result,
  ResultError,
  Service,
  ExceptionsWrapper,
} from '@kishornaik/utils';
import { getQueryRunner, UserEntity,QueryRunner } from '@kishornaik/db';
import { GetUserByIdentifierRequestDto, GetUserByIdentifierResponseDto } from '../../apps/features/v1/getUserByIdentifier/contracts';
import { logger } from '@/shared/utils/helpers/loggers';
import { GetUserByValidationService } from './services/validations';
import { GetUserByIdentifierMapEntityService } from './services/mapEntity';
import { GetUserByIdentifierCacheService } from '../cache/set/services/byIdentifier';
import { NODE_ENV } from '@/config/env';


enum pipelineSteps{
  ValidationService="ValidationService",
  MapEntityService="MapEntityService",
  CacheService="CacheService",
  MapResponseService="MapResponseService"
}

export interface IGetUserByIdentifierWrapperQueryServiceParameters{
  request:GetUserByIdentifierRequestDto;
  queryRunner:QueryRunner;
}

export interface IGetUserByIdentifierWrapperQueryService extends IServiceHandlerAsync<IGetUserByIdentifierWrapperQueryServiceParameters,UserEntity>{}

// #region Query Handler
@sealed
@Service()
export class GetUserByIdentifierWrapperQueryService implements IGetUserByIdentifierWrapperQueryService{

  private pipeline=new PipelineWorkflow(logger);
  private readonly _getUserByValidationService:GetUserByValidationService;
  private readonly _getUserByIdentifierMapEntityService:GetUserByIdentifierMapEntityService;
  private readonly _getUserByIdentifierCacheService:GetUserByIdentifierCacheService;

  public constructor(){
    this._getUserByValidationService=Container.get(GetUserByValidationService);
    this._getUserByIdentifierMapEntityService=Container.get(GetUserByIdentifierMapEntityService);
    this._getUserByIdentifierCacheService=Container.get(GetUserByIdentifierCacheService);
  }
  public handleAsync(params: IGetUserByIdentifierWrapperQueryServiceParameters): Promise<Result<UserEntity, ResultError>> {
    return ExceptionsWrapper.tryCatchResultAsync(async ()=>{
       const {request,queryRunner}=params;

        // Guard
        const guardResult = new GuardWrapper()
          .check(params, 'params')
          .check(request, 'request')
          .validate();
        if (guardResult.isErr())
          return ResultFactory.error<UserEntity>(
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
          const userMapResult=this.pipeline.getResult<UserEntity>(pipelineSteps.MapEntityService);

          const cacheResult=await this._getUserByIdentifierCacheService.handleAsync({
            env:NODE_ENV!,
            key:`user-${userMapResult.identifier}`,
            setParams:{
              queryRunner:queryRunner,
              user:{
                identifier:userMapResult.identifier,
                status:userMapResult.status
              }
            }
          });

          if(cacheResult.isErr()){
            if(cacheResult.error.fallbackObject)
              return ResultFactory.success<UserEntity>(cacheResult.error.fallbackObject as UserEntity);
            return ResultFactory.error<UserEntity>(cacheResult.error.statusCode,cacheResult.error.message);
          }
          return ResultFactory.success<UserEntity>(cacheResult.value);
        });

        // Get User Entity
        const cacheResult=this.pipeline.getResult<UserEntity>(pipelineSteps.CacheService);
        return ResultFactory.success(cacheResult);
      });
    };
}
//#endregion
