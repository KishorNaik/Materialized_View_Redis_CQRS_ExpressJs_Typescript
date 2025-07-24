import { DataSource, QueryRunner, SelectQueryBuilder } from '@kishornaik/utils';
import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USERNAME } from '../env';
import { userModuleEntityFederation } from '../../modules/app.Module';
import { outboxModuleDbDataSourceRegisterEntity } from '../../modules/outbox/outbox.Module';

export const dbDataSource = new DataSource({
	type: 'postgres',
	host: DB_HOST,
	port: parseInt(DB_PORT!),
	username: DB_USERNAME,
	password: DB_PASSWORD,
	database: DB_DATABASE,
	synchronize: false,
	logging: true,
	entities: [...userModuleEntityFederation, ...outboxModuleDbDataSourceRegisterEntity],
	subscribers: [],
	migrations: ['src/migration/**/*.ts'],
	extra: {
		max: 10,
	},
});

async function initializeDatabase() {
	await dbDataSource.initialize();
}

function getQueryRunner(): QueryRunner {
	return dbDataSource.createQueryRunner();
}

async function destroyDatabase() {
	await dbDataSource.destroy();
}

export { initializeDatabase, getQueryRunner, QueryRunner, destroyDatabase, SelectQueryBuilder };
