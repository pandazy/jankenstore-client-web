export interface ResultType<T> {
	isOk: () => boolean;
	isErr: () => boolean;
	unwrap: () => T;
	unwrapErr: () => Error;
}

function ok<T>(value: T): ResultType<T> {
	return {
		isOk: () => true,
		isErr: () => false,
		unwrap: () => value,
		unwrapErr: () => {
			throw new Error(`unwrapErr called on Ok value: ${value}`);
		},
	};
}

function err<T>(error: Error): ResultType<T> {
	return {
		isOk: () => false,
		isErr: () => true,
		unwrap: () => {
			throw error;
		},
		unwrapErr: () => error,
	};
}

const Result = {
	ok,
	err,
};

export default Result;
