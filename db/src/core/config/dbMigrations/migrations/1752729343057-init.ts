import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1752729343057 implements MigrationInterface {
	name = 'Init1752729343057';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "outboxp"."outbox_jobstatus_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')`
		);
		await queryRunner.query(
			`ALTER TABLE "outboxp"."outbox" ADD "jobStatus" "outboxp"."outbox_jobstatus_enum" NOT NULL DEFAULT 'PENDING'`
		);
		await queryRunner.query(
			`ALTER TABLE "outboxp"."outbox" ADD "lockedBy" character varying(100)`
		);
		await queryRunner.query(
			`ALTER TABLE "outboxp"."outbox" ADD "lockedAt" TIMESTAMP DEFAULT now()`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "outboxp"."outbox" DROP COLUMN "lockedAt"`);
		await queryRunner.query(`ALTER TABLE "outboxp"."outbox" DROP COLUMN "lockedBy"`);
		await queryRunner.query(`ALTER TABLE "outboxp"."outbox" DROP COLUMN "jobStatus"`);
		await queryRunner.query(`DROP TYPE "outboxp"."outbox_jobstatus_enum"`);
	}
}
