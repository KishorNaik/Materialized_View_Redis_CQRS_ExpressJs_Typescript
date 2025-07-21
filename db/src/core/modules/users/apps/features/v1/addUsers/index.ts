import { sealed, Service } from "@kishornaik/utils";
import { AddService } from "../../../../../../shared/services/db/add";
import { UserEntity } from "../../../../infrastructures/entity/tUsers";
import { UserCommunicationEntity } from "../../../../infrastructures/entity/tCommunications";
import { UserCredentialsEntity } from "../../../../infrastructures/entity/tCredentials";
import { UserKeysEntity } from "../../../../infrastructures/entity/tKeys";

//#region Add Users
@sealed
@Service()
export class AddUsersDbService extends AddService<UserEntity>{
  public constructor(){
    super(UserEntity)
  }
}

//#endregion

//#region Add Communication
@sealed
@Service()
export class AddUserCommunicationDbService extends AddService<UserCommunicationEntity>{
  public constructor(){
    super(UserCommunicationEntity);
  }
}
//#region

// #region Add Credentials
@sealed
@Service()
export class AddUserCredentialsDbService extends AddService<UserCredentialsEntity>{
  public constructor(){
    super(UserCredentialsEntity);
  }
}
// #endregion

// #region User Keys
@sealed
@Service()
export class AddUserKeysDbService extends AddService<UserKeysEntity>{
  public constructor(){
    super(UserKeysEntity);
  }
}
// #endregion
