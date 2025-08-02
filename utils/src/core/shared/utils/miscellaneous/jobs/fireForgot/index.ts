export namespace FireAndForgetWrapper {
	export const Job = (callBack: () => void) => {
		setImmediate(callBack);
	};

	export interface IJobAsync {
		onRun: () => Promise<void>;
		onError: (err: Error) => void;
		onCleanup: () => Promise<void>;
	}

	export const JobAsync = (params: IJobAsync) => {
		const { onRun, onError, onCleanup } = params;
		setImmediate(async () => {
      try {
        await onRun();
      } catch (err) {
        const error = err as Error;
        if (onError) onError(error);
      } finally {
        try {
          await onCleanup();
        } catch (err) {
          const error = err as Error;
          if (onError) onError(error);
        }
      }
    });
	};
}
