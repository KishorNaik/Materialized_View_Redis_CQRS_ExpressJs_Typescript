import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1753341369993 implements MigrationInterface {
    name = 'Init1753341369993'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "user"`);
        await queryRunner.query(`CREATE TYPE "user"."usersCommunication_status_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TABLE "user"."usersCommunication" ("id" BIGSERIAL NOT NULL, "identifier" character varying(50) NOT NULL, "status" "user"."usersCommunication_status_enum" NOT NULL DEFAULT '0', "created_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "version" integer NOT NULL, "email" character varying(100) NOT NULL, "mobileNo" character varying NOT NULL, "userId" character varying NOT NULL, CONSTRAINT "REL_7f2e9f01037ffe01c50a9ab95a" UNIQUE ("userId"), CONSTRAINT "PK_780582e4bb7f33758ee98f6feba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5991e19ab3c15fc655d82767ac" ON "user"."usersCommunication" ("identifier") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b99ca9c360cc1c3c62143dae84" ON "user"."usersCommunication" ("email") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d579c88842376df82ed766f831" ON "user"."usersCommunication" ("mobileNo") `);
        await queryRunner.query(`CREATE TYPE "user"."usersCredentials_status_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TABLE "user"."usersCredentials" ("id" BIGSERIAL NOT NULL, "identifier" character varying(50) NOT NULL, "status" "user"."usersCredentials_status_enum" NOT NULL DEFAULT '0', "created_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "version" integer NOT NULL, "userName" character varying(100) NOT NULL, "salt" text NOT NULL, "hash" text NOT NULL, "userId" character varying NOT NULL, CONSTRAINT "REL_a1868088106c45bf780b81b882" UNIQUE ("userId"), CONSTRAINT "PK_e372b5067676cfd97595e9a94bf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5b34542818fbe92c194acc7465" ON "user"."usersCredentials" ("identifier") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e2a77b8eb9c6bfefe540b1eaec" ON "user"."usersCredentials" ("userName") `);
        await queryRunner.query(`CREATE TYPE "user"."usersKeys_status_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TABLE "user"."usersKeys" ("id" BIGSERIAL NOT NULL, "identifier" character varying(50) NOT NULL, "status" "user"."usersKeys_status_enum" NOT NULL DEFAULT '0', "created_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "version" integer NOT NULL, "refreshToken" text, "refreshTokenExpiresAt" date, "aesSecretKey" text, "hmacSecretKey" text, "userId" character varying NOT NULL, CONSTRAINT "UQ_8e0e067c9d31721764df95af145" UNIQUE ("aesSecretKey"), CONSTRAINT "UQ_ff4a3f71fc7b256a76b085c8418" UNIQUE ("hmacSecretKey"), CONSTRAINT "REL_8dad5622e2872163359b06dcb3" UNIQUE ("userId"), CONSTRAINT "PK_f83524e6dcdd085a19437309a1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_188994adc77d065ac1572452d6" ON "user"."usersKeys" ("identifier") `);
        await queryRunner.query(`CREATE TYPE "user"."usersSettings_status_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TYPE "user"."usersSettings_isemailverified_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TYPE "user"."usersSettings_isverificationemailsent_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TYPE "user"."usersSettings_iswelcomeemailsent_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TABLE "user"."usersSettings" ("id" BIGSERIAL NOT NULL, "identifier" character varying(50) NOT NULL, "status" "user"."usersSettings_status_enum" NOT NULL DEFAULT '0', "created_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "version" integer NOT NULL, "emailVerificationToken" character varying(50), "emailVerificationTokenExpiresAt" date, "isEmailVerified" "user"."usersSettings_isemailverified_enum" NOT NULL DEFAULT '0', "isVerificationEmailSent" "user"."usersSettings_isverificationemailsent_enum" NOT NULL DEFAULT '0', "isWelcomeEmailSent" "user"."usersSettings_iswelcomeemailsent_enum" NOT NULL DEFAULT '0', "userId" character varying NOT NULL, CONSTRAINT "REL_7d96ee4e2f7c3859cb5faed119" UNIQUE ("userId"), CONSTRAINT "PK_1342b6c4965a154d3280bf3cafc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d5c846569bd98a576b01245290" ON "user"."usersSettings" ("identifier") `);
        await queryRunner.query(`CREATE TYPE "user"."users_status_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TABLE "user"."users" ("id" BIGSERIAL NOT NULL, "identifier" character varying(50) NOT NULL, "status" "user"."users_status_enum" NOT NULL DEFAULT '0', "created_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified_date" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "version" integer NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "clientId" character varying(255) NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2e7b7debda55e0e7280dc93663" ON "user"."users" ("identifier") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6c3a73bbc9d8a8082816adc870" ON "user"."users" ("clientId") `);
        await queryRunner.query(`ALTER TABLE "user"."usersCommunication" ADD CONSTRAINT "FK_7f2e9f01037ffe01c50a9ab95a7" FOREIGN KEY ("userId") REFERENCES "user"."users"("identifier") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user"."usersCredentials" ADD CONSTRAINT "FK_a1868088106c45bf780b81b882a" FOREIGN KEY ("userId") REFERENCES "user"."users"("identifier") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user"."usersKeys" ADD CONSTRAINT "FK_8dad5622e2872163359b06dcb32" FOREIGN KEY ("userId") REFERENCES "user"."users"("identifier") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user"."usersSettings" ADD CONSTRAINT "FK_7d96ee4e2f7c3859cb5faed119d" FOREIGN KEY ("userId") REFERENCES "user"."users"("identifier") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user"."usersSettings" DROP CONSTRAINT "FK_7d96ee4e2f7c3859cb5faed119d"`);
        await queryRunner.query(`ALTER TABLE "user"."usersKeys" DROP CONSTRAINT "FK_8dad5622e2872163359b06dcb32"`);
        await queryRunner.query(`ALTER TABLE "user"."usersCredentials" DROP CONSTRAINT "FK_a1868088106c45bf780b81b882a"`);
        await queryRunner.query(`ALTER TABLE "user"."usersCommunication" DROP CONSTRAINT "FK_7f2e9f01037ffe01c50a9ab95a7"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_6c3a73bbc9d8a8082816adc870"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_2e7b7debda55e0e7280dc93663"`);
        await queryRunner.query(`DROP TABLE "user"."users"`);
        await queryRunner.query(`DROP TYPE "user"."users_status_enum"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_d5c846569bd98a576b01245290"`);
        await queryRunner.query(`DROP TABLE "user"."usersSettings"`);
        await queryRunner.query(`DROP TYPE "user"."usersSettings_iswelcomeemailsent_enum"`);
        await queryRunner.query(`DROP TYPE "user"."usersSettings_isverificationemailsent_enum"`);
        await queryRunner.query(`DROP TYPE "user"."usersSettings_isemailverified_enum"`);
        await queryRunner.query(`DROP TYPE "user"."usersSettings_status_enum"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_188994adc77d065ac1572452d6"`);
        await queryRunner.query(`DROP TABLE "user"."usersKeys"`);
        await queryRunner.query(`DROP TYPE "user"."usersKeys_status_enum"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_e2a77b8eb9c6bfefe540b1eaec"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_5b34542818fbe92c194acc7465"`);
        await queryRunner.query(`DROP TABLE "user"."usersCredentials"`);
        await queryRunner.query(`DROP TYPE "user"."usersCredentials_status_enum"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_d579c88842376df82ed766f831"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_b99ca9c360cc1c3c62143dae84"`);
        await queryRunner.query(`DROP INDEX "user"."IDX_5991e19ab3c15fc655d82767ac"`);
        await queryRunner.query(`DROP TABLE "user"."usersCommunication"`);
        await queryRunner.query(`DROP TYPE "user"."usersCommunication_status_enum"`);
    }

}
