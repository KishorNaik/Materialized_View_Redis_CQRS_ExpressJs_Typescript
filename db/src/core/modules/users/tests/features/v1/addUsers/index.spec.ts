import test, { afterEach, beforeEach, describe } from 'node:test';
import {
	destroyDatabase,
	getQueryRunner,
	initializeDatabase,
	QueryRunner,
} from '../../../../../../config/dbSource';
import { randomUUID } from 'node:crypto';
import { BoolEnum, StatusEnum } from '@kishornaik/utils';
import expect from 'expect';
import {
	UserEntity,
	AddUsersDbService,
	UserCommunicationEntity,
	AddUserCommunicationDbService,
	UserCredentialsEntity,
	AddUserCredentialsDbService,
	UserKeysEntity,
	AddUserKeysDbService,
	UsersSettingsEntity,
	AddUserSettingsDbService,
} from '../../../../user.Module';

describe(`Add-User-Unit-Test`, () => {
	let queryRunner: QueryRunner;

	beforeEach(async () => {
		await initializeDatabase();
		queryRunner = getQueryRunner();
	});

	afterEach(async () => {
		await queryRunner.release();
		await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_all_services_passed' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/users/tests/features/v1/addUsers/index.test.ts
	test(`should_return_true_when_all_services_passed`, async () => {
		await queryRunner.startTransaction();

		const user: UserEntity = new UserEntity();
		user.identifier = randomUUID().toString();
		user.clientId = randomUUID().toString();
		user.firstName = `jhon`;
		user.lastName = `doe`;
		user.status = StatusEnum.ACTIVE;

		const addUserDbServiceResult = await new AddUsersDbService().handleAsync(user, queryRunner);
		if (addUserDbServiceResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(false).toBe(false);
			return;
		}

		const userId = addUserDbServiceResult.value?.identifier;

		// Communication
		const userCommunication = new UserCommunicationEntity();
		userCommunication.identifier = randomUUID().toString();
		userCommunication.status = StatusEnum.ACTIVE;
		userCommunication.email = `john@gmail.com`;
		userCommunication.mobileNo = `9111111111`;
		userCommunication.userId = userId;

		const addUserCommunicationDbServiceResult =
			await new AddUserCommunicationDbService().handleAsync(userCommunication, queryRunner);
		if (addUserCommunicationDbServiceResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(true).toBe(false);
			return;
		}

		const userCred = new UserCredentialsEntity();
		userCred.identifier = randomUUID().toString();
		userCred.status = StatusEnum.ACTIVE;
		userCred.hash = `dummay data`;
		userCred.salt = `dummay data`;
		userCred.userName = userCommunication.email;
		userCred.userId = userId;

		const addUserCredDbServiceResult = await new AddUserCredentialsDbService().handleAsync(
			userCred,
			queryRunner
		);
		if (addUserCredDbServiceResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(true).toBe(false);
			return;
		}

		const userKeys = new UserKeysEntity();
		userKeys.identifier = randomUUID();
		userKeys.status = StatusEnum.ACTIVE;
		userKeys.userId = userId;
		userKeys.aesSecretKey = randomUUID().toString();
		userKeys.hmacSecretKey = randomUUID().toString();
		userKeys.refreshToken = randomUUID().toString();
		userKeys.refreshTokenExpiresAt = new Date();

		const addUserKeysDbServiceResult = await new AddUserKeysDbService().handleAsync(
			userKeys,
			queryRunner
		);
		if (addUserKeysDbServiceResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(true).toBe(false);
			return;
		}

		const userSettings = new UsersSettingsEntity();
		userSettings.identifier = randomUUID().toString();
		userSettings.status = StatusEnum.ACTIVE;
		userSettings.emailVerificationToken = randomUUID().toString();
		userSettings.emailVerificationTokenExpiresAt = new Date();
		userSettings.isEmailVerified = BoolEnum.YES;
		userSettings.isVerificationEmailSent = BoolEnum.YES;
		userSettings.isWelcomeEmailSent = BoolEnum.YES;
		userSettings.userId = userId;

		const addUserSettingsDbServiceResult = await new AddUserSettingsDbService().handleAsync(
			userSettings,
			queryRunner
		);
		if (addUserSettingsDbServiceResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(true).toBe(false);
			return;
		}

		await queryRunner.commitTransaction();
		expect(true).toBe(true);
	});
});
