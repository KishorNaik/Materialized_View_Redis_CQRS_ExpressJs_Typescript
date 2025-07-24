import winston from "winston";

export namespace FireAndForgetWrapper {
  export const Job = (callBack: () => void) => {
    setImmediate(callBack);
  };

  export const JobAsync = (logger: winston.Logger, callBack: () => Promise<void>) => {
  setImmediate(() => {
    callBack().catch((err) => {
      // Optional: log or handle error
      logger.error('FireAndForgetWrapper.JobAsync error:', err);
    });
  });
};
}
