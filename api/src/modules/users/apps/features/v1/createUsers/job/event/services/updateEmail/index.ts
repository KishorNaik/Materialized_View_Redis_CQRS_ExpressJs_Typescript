import { UpdateUserRowVersionService } from "@/modules/users/shared/updateRowVersion";
import { QueryRunner, UpdateUsersDbService, UpdateUserSettingsDbService, UserEntity, UsersSettingsEntity } from "@kishornaik/db";
import { BoolEnum, Container, ExceptionsWrapper, GuardWrapper, IServiceHandlerVoidAsync, Result, ResultError, ResultFactory, sealed, StatusEnum, VOID_RESULT, VoidResult } from "@kishornaik/utils";

Container.set<UpdateUserSettingsDbService>(UpdateUserSettingsDbService, new UpdateUserSettingsDbService());

export interface IUpdateEmailServiceParameters{
  user:UserEntity;
  queryRunner:QueryRunner;
}

export interface IUpdateEmailService extends IServiceHandlerVoidAsync<IUpdateEmailServiceParameters> {}

@sealed
export class UpdateEmailService implements IUpdateEmailService {

  private readonly _updateUserRowVersionService: UpdateUserRowVersionService;
  private readonly _updateUserSettingsDbService: UpdateUserSettingsDbService;
  public constructor() {
    this._updateUserRowVersionService = Container.get(UpdateUserRowVersionService);
    this._updateUserSettingsDbService = Container.get(UpdateUserSettingsDbService);
  }

  public handleAsync(params: IUpdateEmailServiceParameters): Promise<Result<VoidResult, ResultError>> {
    return ExceptionsWrapper.tryCatchResultAsync(async ()=>{

      const {user,queryRunner}=params;
      // Guard
      const guardResult = new GuardWrapper()
        .check(params, 'params')
        .check(user, 'userSettings')
        .check(queryRunner, 'queryRunner')
        .validate();
      if (guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

      // Update Settings
      const userSettingsEntity:UsersSettingsEntity=user.userSettings;
      userSettingsEntity.isWelcomeEmailSent=BoolEnum.YES;
      const updateResult = await this._updateUserSettingsDbService.handleAsync(userSettingsEntity,queryRunner);
      if(updateResult.isErr())
        return ResultFactory.error(updateResult.error.statusCode,updateResult.error.message);

      // Update Row Version
      const updateRowVersionResult = await this._updateUserRowVersionService.handleAsync({
        queryRunner:queryRunner,
        userId:user.identifier,
        status:user.status
      });
      if(updateRowVersionResult.isErr())
        return ResultFactory.error(updateRowVersionResult.error.statusCode,updateRowVersionResult.error.message);

      return ResultFactory.success(VOID_RESULT);
    });
  }

}
