import { UserCommunicationEntity } from "./infrastructures/entity/tCommunications";
import { UserCredentialsEntity } from "./infrastructures/entity/tCredentials";
import { UserKeysEntity } from "./infrastructures/entity/tKeys";
import { UsersSettingsEntity } from "./infrastructures/entity/tSettings";
import { UserEntity } from "./infrastructures/entity/tUsers";

// Entity
export const userModuleEntityFederation:Function[]=[UserEntity,UserCommunicationEntity,UserKeysEntity, UserCredentialsEntity,UsersSettingsEntity];

export * from "./infrastructures/entity/tUsers/index";
export * from "./infrastructures/entity/tCommunications/index";
export * from "./infrastructures/entity/tCredentials/index";
export * from "./infrastructures/entity/tKeys/index";
export * from "./infrastructures/entity/tSettings/index";

// Service
export * from "./apps/features/v1/addUsers/index";
