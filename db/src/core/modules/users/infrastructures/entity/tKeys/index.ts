import { Column, Entity, JoinColumn, OneToOne, ViewColumn } from '@kishornaik/utils';
import { BaseEntity } from '../../../../../shared/entity/base';
import { UserEntity } from '../tUsers';
import { IsEmpty, IsNotEmpty, ValidateIf } from 'class-validator';

@Entity({ schema: `user`, name: `usersKeys` })
export class UserKeysEntity extends BaseEntity {
	@Column(`text`, { nullable: true })
	@ValidateIf((v) => v.refreshToken !== null && v.refreshToken !== undefined)
	@IsNotEmpty()
	public refreshToken?: string;

	@Column(`date`, { nullable: true })
	public refreshTokenExpiresAt?: Date | null;

	@Column(`text`, { nullable: true, unique: true })
	@IsNotEmpty()
	public aesSecretKey?: string;

	@Column(`text`, { nullable: true, unique: true })
	@IsNotEmpty()
	public hmacSecretKey?: string;

	@ViewColumn({ name: `userId` })
	public userId?: string;

	@OneToOne(() => UserEntity, (users) => users.userKeys, { cascade: true })
	@JoinColumn({ name: 'userId', referencedColumnName: 'identifier' })
	public users?: UserEntity;
}
