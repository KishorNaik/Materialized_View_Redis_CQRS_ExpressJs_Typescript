import test, { afterEach, beforeEach, describe } from 'node:test';
import { BoolEnum, Guid, QueryRunner, StatusEnum } from '@kishornaik/utils';
import expect from 'expect';
import {
	destroyDatabase,
	getQueryRunner,
	initializeDatabase,
} from '../../../../../../config/dbSource';
import { randomUUID } from 'crypto';
import {
	AddOutboxDbService,
	GetOutboxDbDto,
	GetOutboxDbService,
	OutboxEntity,
} from '../../../../outbox.Module';

// Debug Mode:All Test Case Run
//node --trace-deprecation --test --require ts-node/register -r tsconfig-paths/register ./src/core/modules/outbox/tests/features/v1/getOutbox/index.test.ts

// Debug Mode:Specific Test Case Run
//node --trace-deprecation --test --test-name-pattern='test_name' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/outbox/tests/features/v1/getOutbox/index.test.ts

// If Debug not Worked then use
//node --trace-deprecation --test --test-name-pattern='test_name' --require ts-node/register --inspect=4321 -r tsconfig-paths/register ./src/core/modules/outbox/tests/features/v1/getOutbox/index.test.ts

describe(`Get-Outbox-Unit-Tests`, () => {
	let queryRunner: QueryRunner;

	beforeEach(async () => {
		await initializeDatabase();
		queryRunner = getQueryRunner();
	});

	afterEach(async () => {
		await queryRunner.release();
		await destroyDatabase();
	});

	//node --trace-deprecation --test --test-name-pattern='should_return_false_when_validation_service_failed' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/outbox/tests/features/v1/getOutbox/index.test.ts
	test(`should_return_false_when_validation_service_failed`, async () => {
		const request: GetOutboxDbDto = new GetOutboxDbDto();
		request.eventType = '';
		request.instanceId = '';
		request.take = 15;

		await queryRunner.startTransaction();

		const result = await new GetOutboxDbService().handleAsync({
			request: request,
			queryRunner: queryRunner,
		});
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

	//node --trace-deprecation --test --test-name-pattern='should_return_false_when_No_Outbox_Found' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/outbox/tests/features/v1/getOutbox/index.test.ts
	test(`should_return_false_when_No_Outbox_Found`, async () => {
		const request: GetOutboxDbDto = new GetOutboxDbDto();
		request.eventType = 'UserEmailSendEvent1';
		request.instanceId = '';
		request.take = 12;

		await queryRunner.startTransaction();

		const result = await new GetOutboxDbService().handleAsync({
			request: request,
			queryRunner: queryRunner,
		});
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

	//node --trace-deprecation --test --test-name-pattern='should_return_true_when_all_service_passed' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/outbox/tests/features/v1/getOutbox/index.test.ts
	test(`should_return_true_when_all_service_passed`, async () => {
		const request: GetOutboxDbDto = new GetOutboxDbDto();
		request.eventType = 'send-welcome-user-integration-event-queue';
		request.instanceId = `machine_1`;
		request.take = 12;

		await queryRunner.startTransaction();

		const result = await new GetOutboxDbService().handleAsync({
			request: request,
			queryRunner: queryRunner,
		});
		const isError = result.isErr();
		if (isError) {
			await queryRunner.rollbackTransaction();
			console.log(`Error: ${result.error.message}`);
			expect(isError).toBe(false);
			return;
		}

		await queryRunner.commitTransaction();

		console.log(`result: ${JSON.stringify(result.value)}`);

		expect(result.isOk()).toBe(true);
	});
});
