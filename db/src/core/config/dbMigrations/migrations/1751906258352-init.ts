import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1751906258352 implements MigrationInterface {
	name = 'Init1751906258352';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "user"`);
		await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "outboxp"`);
		await queryRunner.query(`CREATE TYPE "user"."users_status_enum" AS ENUM('1', '0')`);
		await queryRunner.query(
			`CREATE TABLE "user"."users" ("id" BIGSERIAL NOT NULL, "identifier" character varying(50) NOT NULL, "status" "user"."users_status_enum" NOT NULL DEFAULT '0', "created_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "version" integer NOT NULL, "fullName" character varying(100) NOT NULL, "email" character varying(100) NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_2e7b7debda55e0e7280dc93663" ON "user"."users" ("identifier") `
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "user"."users" ("email") `
		);
		await queryRunner.query(`CREATE TYPE "outboxp"."outbox_status_enum" AS ENUM('1', '0')`);
		await queryRunner.query(
			`CREATE TYPE "outboxp"."outbox_ispublished_enum" AS ENUM('1', '0')`
		);
		await queryRunner.query(
			`CREATE TABLE "outboxp"."outbox" ("id" BIGSERIAL NOT NULL, "identifier" character varying(50) NOT NULL, "status" "outboxp"."outbox_status_enum" NOT NULL DEFAULT '0', "created_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "version" integer NOT NULL, "eventType" character varying(100) NOT NULL, "payload" jsonb NOT NULL, "isPublished" "outboxp"."outbox_ispublished_enum" NOT NULL DEFAULT '0', CONSTRAINT "PK_340ab539f309f03bdaa14aa7649" PRIMARY KEY ("id"))`
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_8e1c50bfbe286eaa5b62e86298" ON "outboxp"."outbox" ("identifier") `
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "outboxp"."IDX_8e1c50bfbe286eaa5b62e86298"`);
		await queryRunner.query(`DROP TABLE "outboxp"."outbox"`);
		await queryRunner.query(`DROP TYPE "outboxp"."outbox_ispublished_enum"`);
		await queryRunner.query(`DROP TYPE "outboxp"."outbox_status_enum"`);
		await queryRunner.query(`DROP INDEX "user"."IDX_97672ac88f789774dd47f7c8be"`);
		await queryRunner.query(`DROP INDEX "user"."IDX_2e7b7debda55e0e7280dc93663"`);
		await queryRunner.query(`DROP TABLE "user"."users"`);
		await queryRunner.query(`DROP TYPE "user"."users_status_enum"`);
	}
}
