import { Container, ExceptionsWrapper, GuardWrapper, IServiceHandlerVoidAsync, PipelineWorkflow, Result, ResultError, ResultFactory, Service,StatusEnum,VOID_RESULT,VoidResult,sealed} from "@kishornaik/utils";
import {  QueryRunner, } from "@kishornaik/db";
import { logger } from "@/shared/utils/helpers/loggers";
import { GetUserByIdentifierCacheService } from "./services/byIdentifier";
import { NODE_ENV } from "@/config/env";
export interface IUserSharedCacheServiceParameters{
  queryRunner:QueryRunner;
  user:{
    identifier:string;
    status:StatusEnum;
  }
}

export interface IUserSharedCacheService extends IServiceHandlerVoidAsync<IUserSharedCacheServiceParameters>{}

enum pipelineSteps{
  byIdentifier="ByIdentifier"
}

@sealed
@Service()
export class UserSharedCacheService implements IUserSharedCacheService{

  private pipeline=new PipelineWorkflow(logger);
  private readonly _getUserByIdentifierCacheService:GetUserByIdentifierCacheService;

  public constructor(){
    this._getUserByIdentifierCacheService=Container.get(GetUserByIdentifierCacheService);
  }

  public handleAsync(params: IUserSharedCacheServiceParameters): Promise<Result<VoidResult, ResultError>> {
    return ExceptionsWrapper.tryCatchResultAsync(async ()=>{

      const {queryRunner,user}=params;
      const {identifier, status}=user;

      // Guard
      const guardResult=new GuardWrapper()
        .check(params,'params')
        .check(user,'user')
        .check(queryRunner,'queryRunner')
        .validate();
      if(guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode,guardResult.error.message);

      // By Identifier
      await this.pipeline.step(pipelineSteps.byIdentifier,async ()=>{
        return await this._getUserByIdentifierCacheService.handleAsync({
          env:NODE_ENV!,
          key:`user-${identifier}`,
          setParams:{
            queryRunner:queryRunner,
            user:{
              identifier:identifier,
              status:status
            }
          }
        });
      });

      return ResultFactory.success(VOID_RESULT);
    });
  }

}

