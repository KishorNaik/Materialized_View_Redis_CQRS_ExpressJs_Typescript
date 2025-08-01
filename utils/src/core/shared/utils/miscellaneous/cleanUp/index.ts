export namespace CleanUpWrapper {
	export const run = (fn: Function) => {
		try {
			fn();
		} catch (err) {
			console.error('Cleanup failed:', err);
		}
	};
}
