import { ExceptionsWrapper, GuardWrapper, IServiceHandlerAsync, Result, ResultError, ResultFactory, sealed, Service, StatusCodes, StatusEnum } from "@kishornaik/utils";
import { GetUserByIdentifierRequestDto } from "../../../../apps/features/v1/getUserByIdentifier/contracts";
import { UserEntity } from "@kishornaik/db";

export interface IGetGetUserByIdentifierMapEntityService extends IServiceHandlerAsync<GetUserByIdentifierRequestDto,UserEntity>{}

@sealed
@Service()
export class GetUserByIdentifierMapEntityService implements IGetGetUserByIdentifierMapEntityService {
  public handleAsync(params: GetUserByIdentifierRequestDto): Promise<Result<UserEntity, ResultError>> {
    return  ExceptionsWrapper.tryCatchResultAsync(async ()=>{

      // Gard
      const guardResult = new GuardWrapper()
        .check(params, 'params')
        .validate();
      if (guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

      //  Map
      const userEntity = new UserEntity();
      userEntity.identifier = params.id;
      userEntity.status=StatusEnum.ACTIVE;

      return ResultFactory.success(userEntity);

    })
  }

}
