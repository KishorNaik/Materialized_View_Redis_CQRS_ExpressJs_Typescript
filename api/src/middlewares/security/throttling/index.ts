import {
	GLOBAL_WINDOW_MINUTES,
	SLOW_DOWN_DELAY_AFTER_HITS,
	SLOW_DOWN_INITIAL_DELAY_MS,
	SLOW_DOWN_MAX_DELAY_MS,
} from '@/config/env';
import { Options, slowDown } from 'express-slow-down';
import express, { Request, Response, NextFunction } from 'express';

export const throttlingMiddleware = slowDown({
	windowMs: parseInt(GLOBAL_WINDOW_MINUTES),
	delayAfter: parseInt(SLOW_DOWN_DELAY_AFTER_HITS),
	delayMs: (hits: number) => {
		// Progressive delay, capped at SLOW_DOWN_MAX_DELAY_MS
		const calculatedDelay =
			(hits - parseInt(SLOW_DOWN_DELAY_AFTER_HITS) + 1) *
			parseInt(SLOW_DOWN_INITIAL_DELAY_MS);
		return Math.min(calculatedDelay, parseInt(SLOW_DOWN_MAX_DELAY_MS));
	},
	keyGenerator: (req: Request) => req.ip,
});
