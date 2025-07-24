import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1753374003039 implements MigrationInterface {
    name = 'Init1753374003039'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "outboxp"`);
        await queryRunner.query(`CREATE TYPE "outboxp"."outbox_status_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TYPE "outboxp"."outbox_ispublished_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TYPE "outboxp"."outbox_jobstatus_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "outboxp"."outbox" ("id" BIGSERIAL NOT NULL, "identifier" character varying(50) NOT NULL, "status" "outboxp"."outbox_status_enum" NOT NULL DEFAULT '0', "created_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "version" integer NOT NULL, "eventType" character varying(100) NOT NULL, "payload" jsonb NOT NULL, "isPublished" "outboxp"."outbox_ispublished_enum" NOT NULL DEFAULT '0', "jobStatus" "outboxp"."outbox_jobstatus_enum" NOT NULL DEFAULT 'PENDING', "lockedBy" character varying(100), "lockedAt" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_340ab539f309f03bdaa14aa7649" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8e1c50bfbe286eaa5b62e86298" ON "outboxp"."outbox" ("identifier") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "outboxp"."IDX_8e1c50bfbe286eaa5b62e86298"`);
        await queryRunner.query(`DROP TABLE "outboxp"."outbox"`);
        await queryRunner.query(`DROP TYPE "outboxp"."outbox_jobstatus_enum"`);
        await queryRunner.query(`DROP TYPE "outboxp"."outbox_ispublished_enum"`);
        await queryRunner.query(`DROP TYPE "outboxp"."outbox_status_enum"`);
    }

}
