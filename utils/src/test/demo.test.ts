import { test } from 'node:test';
import assert from 'node:assert';

test.only('On-Success', async () => {
	assert.strictEqual(2, 2);
});
