import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1753529865873 implements MigrationInterface {
	name = 'Init1753529865873';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "outboxp"."outbox" ADD "traceId" character varying(100)`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "outboxp"."outbox" DROP COLUMN "traceId"`);
	}
}
