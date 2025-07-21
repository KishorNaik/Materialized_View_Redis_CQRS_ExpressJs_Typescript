export const VOID_RESULT = Symbol('void');
export type VoidResult = typeof VOID_RESULT;

export function isVoidResult(value: unknown | any): value is VoidResult {
	return value === VOID_RESULT;
}
