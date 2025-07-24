import test, { afterEach, beforeEach, describe } from 'node:test';
import { BoolEnum, Guid, QueryRunner, StatusEnum } from '@kishornaik/utils';
import expect from 'expect';
import {
	destroyDatabase,
	getQueryRunner,
	initializeDatabase,
} from '../../../../../../config/dbSource';
import { randomUUID } from 'crypto';
import { AddOutboxDbService, JobStatusEnum, OutboxEntity } from '../../../../outbox.Module';
import { UpdateOutboxDbService } from '../../../../apps/features/v1/updateOutbox';

// Debug Mode:All Test Case Run
//node --trace-deprecation --test --require ts-node/register -r tsconfig-paths/register ./src/core/modules/outbox/tests/features/v1/updateOutbox/index.test.ts

// Debug Mode:Specific Test Case Run
//node --trace-deprecation --test --test-name-pattern='test_name' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/outbox/tests/features/v1/updateOutbox/index.test.ts

// If Debug not Worked then use
//node --trace-deprecation --test --test-name-pattern='test_name' --require ts-node/register --inspect=4321 -r tsconfig-paths/register ./src/core/modules/outbox/tests/features/v1/updateOutbox/index.test.ts

describe(`Add-Outbox-Unit-Tests`, () => {
	let queryRunner: QueryRunner;

	beforeEach(async () => {
		await initializeDatabase();
		queryRunner = getQueryRunner();
	});

	afterEach(async () => {
		await queryRunner.release();
		await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_when_entity_identifier_is_not_provided' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/outbox/tests/features/v1/updateOutbox/index.test.ts
	test(`should_return_false_when_entity_identifier_is_not_provided`, async () => {
		const entity: OutboxEntity = new OutboxEntity();

		await queryRunner.startTransaction();

		const result = await new UpdateOutboxDbService().handleAsync(entity, queryRunner);
		const isError = result.isErr();
		if (isError) {
			await queryRunner.rollbackTransaction();
			console.log(`Error: ${result.error.message}`);
			expect(isError).toBe(true);
			return;
		}

		await queryRunner.commitTransaction();
		expect(result.isOk()).toBe(false);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_when_entity_status_is_not_provided' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/outbox/tests/features/v1/updateOutbox/index.test.ts
	test(`should_return_false_when_entity_status_is_not_provided`, async () => {
		const entity: OutboxEntity = new OutboxEntity();
		entity.identifier = `2c530f28-d9ea-422b-96e1-1459d45d6adf`;

		await queryRunner.startTransaction();

		const result = await new UpdateOutboxDbService().handleAsync(entity, queryRunner);
		const isError = result.isErr();
		if (isError) {
			await queryRunner.rollbackTransaction();
			console.log(`Error: ${result.error.message}`);
			expect(isError).toBe(true);
			return;
		}

		await queryRunner.commitTransaction();
		expect(result.isOk()).toBe(false);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_all_services_pass' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/outbox/tests/features/v1/updateOutbox/index.test.ts
	test(`should_return_true_when_all_services_pass`, async () => {
		const entity: OutboxEntity = new OutboxEntity();
		entity.identifier = `2c530f28-d9ea-422b-96e1-1459d45d6adf`;
		entity.status = StatusEnum.ACTIVE;
		entity.isPublished = BoolEnum.YES;
		entity.jobStatus = JobStatusEnum.COMPLETED;

		await queryRunner.startTransaction();

		const result = await new UpdateOutboxDbService().handleAsync(entity, queryRunner);
		const isError = result.isErr();
		if (isError) {
			await queryRunner.rollbackTransaction();
			console.log(`Error: ${result.error.message}`);
			expect(isError).toBe(false);
			return;
		}

		await queryRunner.commitTransaction();
		expect(result.isOk()).toBe(true);
	});
});
