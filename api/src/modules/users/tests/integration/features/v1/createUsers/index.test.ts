import request from 'supertest';
import expect from 'expect';
import { App } from '@/app';
import { restApiModulesFederation } from '@/modules/app.Module';
import { AES, AesRequestDto, ValidateEnv } from '@kishornaik/utils';
import { describe, it } from 'node:test';
import { destroyDatabase, initializeDatabase } from '@kishornaik/db';
import { CreateUserRequestDto } from '@/modules/users/apps/features/v1/createUsers';
import { ENCRYPTION_KEY } from '@/config/env';

process.env.NODE_ENV = 'development';
process.env.ENCRYPTION_KEY = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M6';
ValidateEnv();

const appInstance = new App();
appInstance.initializeRestApiRoutes([...restApiModulesFederation]);
appInstance.initializeErrorHandling();
const app = appInstance.getServer();

describe(`Create_User_Module_Integration_Tests`, () => {
	// node --trace-deprecation --test --test-name-pattern='should_return_201_when_all_services_execute_successfully' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/features/v1/createUsers/index.test.ts
	it(`should_return_201_when_all_services_execute_successfully`, async () => {
		await initializeDatabase();

		const requestDto: CreateUserRequestDto = new CreateUserRequestDto();
		requestDto.firstName ='jelly';
		requestDto.lastName = 'Doe';
		requestDto.email = `jelly.doe@example.com`;
		requestDto.password = 'password0123';
		requestDto.mobileNo = '9111111139';

		const aes = new AES(ENCRYPTION_KEY);
		const encryptRequestBody = await aes.encryptAsync(JSON.stringify(requestDto));

		const aesRequestDto: AesRequestDto = new AesRequestDto();
		aesRequestDto.body = encryptRequestBody;

		const response = await request(app).post('/api/v1/users').send(aesRequestDto);
		if (response.status !== 201) {
			await destroyDatabase();
			setTimeout(() => {
				process.exit(0);
			}, 5000);
			expect(true).toBe(false);
		}

		await destroyDatabase();
		setTimeout(() => {
			process.exit(0);
		}, 5000);
		expect(response.status).toBe(201);
	});
});
