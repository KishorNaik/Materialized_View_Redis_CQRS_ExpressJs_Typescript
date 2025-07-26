import { initializeDatabase } from '@kishornaik/db';

export const setDatabase = async (): Promise<void> => {
	// Set Database Here
	await initializeDatabase();
	return Promise.resolve();
};
