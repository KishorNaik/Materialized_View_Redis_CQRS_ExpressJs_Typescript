import { BoolEnum, Column, Entity, IsSafeString } from '@kishornaik/utils';
import { BaseEntity } from '../../../../shared/entity/base';
import { IsNotEmpty, IsString } from 'class-validator';

export enum JobStatusEnum {
	PENDING = 'PENDING',
	PROCESSING = 'PROCESSING',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED',
}

@Entity({ schema: `outboxp`, name: 'outbox' })
export class OutboxEntity extends BaseEntity {
	@Column(`varchar`, { length: 100, nullable: false })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public eventType?: string;

	@Column(`jsonb`, { nullable: false })
	@IsNotEmpty()
	public payload?: string;

	@Column('enum', { enum: BoolEnum, default: BoolEnum.NO })
	public isPublished?: BoolEnum;

	@Column(`enum`, { enum: JobStatusEnum, default: JobStatusEnum.PENDING })
	public jobStatus?: JobStatusEnum;

	@Column(`varchar`, { length: 100, nullable: true })
	@IsNotEmpty()
	public lockedBy?: string;

	// Defaults to current timestamp
	@Column(`timestamp`, { nullable: true, default: () => 'CURRENT_TIMESTAMP' })
	public lockedAt?: Date;

	@Column(`varchar`, { length: 100, nullable: true })
	@IsNotEmpty()
	public traceId?: string;
}
