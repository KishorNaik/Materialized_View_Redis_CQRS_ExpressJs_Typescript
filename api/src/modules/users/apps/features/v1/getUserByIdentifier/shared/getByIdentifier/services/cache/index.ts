import {Container, ExceptionsWrapper, GuardWrapper, RedisHelper, RedisStoreWrapper, Result, ResultError, ResultFactory, RowVersionNumber, sealed, Service, StatusEnum } from "@kishornaik/utils";
import { GetUserByIdentifierDbService, GetUserRowVersionDbService, QueryRunner, UserEntity} from "@kishornaik/db";
import { logger } from "@/shared/utils/helpers/loggers";

Container.set<GetUserRowVersionDbService>(GetUserRowVersionDbService, new GetUserRowVersionDbService());
Container.set<GetUserByIdentifierDbService>(GetUserByIdentifierDbService,new GetUserByIdentifierDbService());

export interface IGetUserByIdentifierCacheServiceParameters {
  queryRunner:QueryRunner;
  user:UserEntity;
}

@sealed
@Service()
export class GetUserByIdentifierCacheService extends RedisStoreWrapper<IGetUserByIdentifierCacheServiceParameters,UserEntity> {

  private readonly _getUserByIdentifierDbService:GetUserByIdentifierDbService;
  private readonly _getUserRowVersionDbService:GetUserRowVersionDbService;

  public constructor(){
    const redisHelper=new RedisHelper();
    super(redisHelper,logger);

    this._getUserByIdentifierDbService=Container.get(GetUserByIdentifierDbService);
    this._getUserRowVersionDbService=Container.get(GetUserRowVersionDbService);
  }

  protected async setCacheDataAsync(params: IGetUserByIdentifierCacheServiceParameters): Promise<Result<UserEntity, ResultError>> {
    return await ExceptionsWrapper.tryCatchResultAsync<UserEntity>(async ()=>{
      const {queryRunner,user}=params;

      // Guard
      const guardResult = new GuardWrapper()
        .check(params, 'params')
        .check(user, 'user')
        .check(queryRunner, 'queryRunner')
        .validate();
      if (guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

      const userEntityResult=await this._getUserByIdentifierDbService.handleAsync({
        queryRunner:queryRunner,
        userEntity:user
      });
      if(userEntityResult.isErr())
        return ResultFactory.error(userEntityResult.error.statusCode,userEntityResult.error.message);

      return ResultFactory.success(userEntityResult.value);

    });
  }
  protected async getRowVersionAsync(params: IGetUserByIdentifierCacheServiceParameters): Promise<Result<RowVersionNumber, ResultError>> {
    return await ExceptionsWrapper.tryCatchResultAsync(async ()=>{

      const {queryRunner,user}=params;

      // Guard
      const guardResult = new GuardWrapper()
        .check(params, 'params')
        .check(user, 'user')
        .check(queryRunner, 'queryRunner')
        .validate();
      if (guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

      const rowVersionResult=await this._getUserRowVersionDbService.handleAsync(user,queryRunner);
      if(rowVersionResult.isErr())
        return ResultFactory.error(rowVersionResult.error.statusCode,rowVersionResult.error.message);

      return ResultFactory.success(rowVersionResult.value.version as RowVersionNumber);
    })
  }

}
