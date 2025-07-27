export namespace FireAndForgetWrapper {
	export const Job = (callBack: () => void) => {
		setImmediate(callBack);
	};

	export interface IJobAsync {
		onRun: () => Promise<void>;
		onError: (err: Error) => void;
    onCleanup:()=>Promise<void>
	}

	export const JobAsync = (params: IJobAsync) => {
		const { onRun, onError, onCleanup } = params;
		setImmediate(() => {
			onRun().catch((err) => {
				if (onError) onError(err);
			});
      onCleanup().catch((err) => {
        if (onError) onError(err);
      });
		});
	};
}
