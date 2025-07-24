import { OutboxEntity } from './infrastructure/entity';

// Entity Db Datasource Register
export const outboxModuleDbDataSourceRegisterEntity: Function[] = [OutboxEntity];

// Export Outbox Module
export * from './infrastructure/entity/index';
export * from './apps/features/v1/addOutbox/index';
export * from './apps/features/v1/getOutBox/index';
export * from './apps/features/v1/updateOutbox/index';
