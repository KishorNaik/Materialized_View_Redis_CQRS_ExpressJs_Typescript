import { sealed, Service } from '@kishornaik/utils';
import { UserEntity } from '../../../../infrastructures/entity/tUsers';
import { UserCommunicationEntity } from '../../../../infrastructures/entity/tCommunications';
import { UserCredentialsEntity } from '../../../../infrastructures/entity/tCredentials';
import { UserKeysEntity } from '../../../../infrastructures/entity/tKeys';
import { UsersSettingsEntity } from '../../../../user.Module';
import { UpdateService } from '../../../../../../shared/services/db/update';

//#region Add Users
@sealed
@Service()
export class UpdateUsersDbService extends UpdateService<UserEntity> {
	public constructor() {
		super(UserEntity);
	}
}

//#endregion

//#region Add User Communication
@sealed
@Service()
export class UpdateUserCommunicationDbService extends UpdateService<UserCommunicationEntity> {
	public constructor() {
		super(UserCommunicationEntity);
	}
}
//#region

// #region Add User Credentials
@sealed
@Service()
export class UpdateUserCredentialsDbService extends UpdateService<UserCredentialsEntity> {
	public constructor() {
		super(UserCredentialsEntity);
	}
}
// #endregion

// #region User Keys
@sealed
@Service()
export class UpdateUserKeysDbService extends UpdateService<UserKeysEntity> {
	public constructor() {
		super(UserKeysEntity);
	}
}
// #endregion

// #region User Settings
@sealed
@Service()
export class UpdateUserSettingsDbService extends UpdateService<UsersSettingsEntity> {
	public constructor() {
		super(UsersSettingsEntity);
	}
}
// #endregion
