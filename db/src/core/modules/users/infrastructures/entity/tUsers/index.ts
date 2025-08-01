import { Column, Entity, Index, IsSafeString, OneToOne } from '@kishornaik/utils';
import { IsNotEmpty, IsString } from 'class-validator';
import { BaseEntity } from '../../../../../shared/entity/base';
import { UserCommunicationEntity } from '../tCommunications';
import { UserCredentialsEntity } from '../tCredentials';
import { UserKeysEntity } from '../tKeys';
import { UsersSettingsEntity } from '../tSettings';

@Entity({ schema: `user`, name: 'users' })
export class UserEntity extends BaseEntity {
	@Column(`varchar`, { length: 100, nullable: false })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public firstName?: string;

	@Column(`varchar`, { length: 100, nullable: false })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public lastName?: string;

	@Column(`varchar`, { length: 255, nullable: false })
	@Index({ unique: true })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public clientId?: string;

	@OneToOne(() => UserCommunicationEntity, (userCommunication) => userCommunication.users)
	public userCommunication?: UserCommunicationEntity;

	@OneToOne(() => UserCredentialsEntity, (userCredentials) => userCredentials.users)
	public userCredentials?: UserCredentialsEntity;

	@OneToOne(() => UserKeysEntity, (userKeys) => userKeys.users)
	public userKeys?: UserKeysEntity;

	@OneToOne(() => UsersSettingsEntity, (userSettings) => userSettings.users)
	public userSettings?: UsersSettingsEntity;
}
