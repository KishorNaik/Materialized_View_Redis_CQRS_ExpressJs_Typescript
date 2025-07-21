import { Result } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';
import { ISagaContext, SagaStep } from '../types';
import winston from 'winston';
import { SagaExecutionException } from '../exceptions';

export class SagaOrchestratorBuilder<TContext> {
	private steps: SagaStep<TContext, any>[] = [];
	private sagaCtx: ISagaContext<TContext>;
	private results: Map<string, unknown> = new Map();
	private logger: winston.Logger;
	private sagaName: string;

	constructor(name: string, initialContext: TContext, logger: winston.Logger) {
		this.sagaName = name;
		this.logger = logger;
		this.sagaCtx = {
			isSuccess: false,
			context: initialContext,
		};
	}

	public step<TResult>(step: SagaStep<TContext, TResult>): this {
		this.steps.push(step);
		return this;
	}

	public getStepResult<TResult>(label: string): TResult | undefined {
		return this.results.get(label) as TResult;
	}

	public getContext(): ISagaContext<TContext> {
		return this.sagaCtx;
	}

	public async runAsync(resumeFromLabel?: string): Promise<void> {
		this.logger.info(`[${this.sagaName}] ▶️ Starting saga run`);
		const executedSteps: SagaStep<TContext, any>[] = [];
		let resume = !resumeFromLabel;

		for (const step of this.steps) {
			if (!resume && step.label !== resumeFromLabel) continue;
			resume = true;

			let attempt = 0;
			const maxAttempts = step.retry ?? 1;

			while (attempt < maxAttempts) {
				try {
					const result = await step.action(this.sagaCtx);

					if (result.isOk()) {
						this.logger.debug(`[${this.sagaName}] ✅ Step "${step.label}" succeeded`);
						this.results.set(step.label, result.value);
						executedSteps.push(step);
						break;
					} else {
						attempt++;
						this.logger.warn(
							`[${this.sagaName}] ⚠️ Step "${step.label}" failed: ${result.error.message}`
						);
						if (step.onError) await step.onError(result.error, this.sagaCtx);

						if (attempt >= maxAttempts) {
							this.logger.error(
								`[${this.sagaName}] ❌ "${step.label}" failed after ${maxAttempts} attempts. Starting compensation...`
							);

							let allCompensated = true;
							this.logger.info(
								`[${this.sagaName}] executedSteps:`,
								executedSteps?.length
							);

							for (const executed of executedSteps.reverse()) {
								try {
									await executed.compensate(this.sagaCtx);
									this.logger.info(
										`[${this.sagaName}] ↩️ Compensated "${executed.label}"`
									);
								} catch (compErr) {
									this.logger.error(
										`[${this.sagaName}] 💥 Compensation failed for "${executed.label}":`,
										compErr
									);
									allCompensated = false;
								}
							}

							throw new SagaExecutionException(
								step.label,
								result.error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR,
								result.error.message,
								allCompensated,
								result.error.stackTrace
							);
						}

						this.logger.info(
							`[${this.sagaName}] 🔁 Retrying "${step.label}" (${attempt}/${maxAttempts})`
						);
					}
				} catch (err) {
					this.logger.error(
						`[${this.sagaName}] 🔥 Unexpected error in "${step.label}":`,
						err
					);
					throw err;
				}
			}
		}

		this.sagaCtx.isSuccess = true;
		this.logger.info(`[${this.sagaName}] 🏁 Saga completed successfully`);
	}
}
