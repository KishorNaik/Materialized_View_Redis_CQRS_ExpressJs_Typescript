export namespace CleanUpWrapper {
	export const run = (fn: Function) => {
		try {
      setImmediate(()=>{
        fn();
      });
		} catch (err) {
			console.error('Cleanup failed:', err);
		}
	};
}
