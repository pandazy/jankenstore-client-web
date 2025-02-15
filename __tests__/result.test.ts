import Result from '../src/data/result';
const { ok, err } = Result;

describe('Tests for Result', () => {
	it('Should create ok Result', () => {
		const result = ok(1);
		expect(result.isOk()).toBe(true);
		expect(result.isErr()).toBe(false);
		expect(result.unwrap()).toBe(1);
		expect(() => result.unwrapErr()).toThrowErrorMatchingSnapshot();
	});

	it('Should create err Result', () => {
		const error = new Error('Test error');
		const result = err(error);
		expect(result.isOk()).toBe(false);
		expect(result.isErr()).toBe(true);
		expect(() => result.unwrap()).toThrowErrorMatchingSnapshot();
		expect(result.unwrapErr()).toEqual(error);
	});
});
