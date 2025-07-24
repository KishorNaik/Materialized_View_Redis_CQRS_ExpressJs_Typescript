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
import { GetUserByIdentifierDbService } from '../../../../apps/features/v1/getUserByIdentifier';
import { GetUserRowVersionDbService } from '../../../../apps/features/v1/getUserRowVersion';
import { UserEntity } from '../../../../user.Module';

describe(`Get-User-Row-Version-Unit-Test`, () => {
	let queryRunner: QueryRunner;

	beforeEach(async () => {
		await initializeDatabase();
		queryRunner = getQueryRunner();
	});

	afterEach(async () => {
		await queryRunner.release();
		await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_all_services_passed' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/users/tests/features/v1/getUserRowVersion/index.test.ts
	test(`should_return_true_when_all_services_passed`, async () => {
		const user: UserEntity = new UserEntity();
		user.identifier = `509cc300-fc80-45b7-828c-3bf0108f329a`;
		user.status = StatusEnum.ACTIVE;

		await queryRunner.startTransaction();

		const result = await new GetUserRowVersionDbService().handleAsync(user, queryRunner);
		if (result.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(false).toBe(true);
			return;
		}

		await queryRunner.commitTransaction();
		expect(true).toBe(true);
	});
});
