export const JobPromise = (callBack: Function) => {
	Promise.resolve(callBack()).catch((error) => {
		throw error;
	});
};

export const JobFireAndForget = (callBack: () => void) => {
	setImmediate(callBack);
};
