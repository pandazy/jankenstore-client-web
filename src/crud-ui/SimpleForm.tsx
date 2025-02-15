import { Alert, Button, LinearProgress, Stack, TextField } from '@mui/material';
import {
	useMutation,
	UseMutationOptions,
	UseMutationResult,
} from '@tanstack/react-query';
import {
	HTMLInputTypeAttribute,
	ReactElement,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';

type RawInput = Record<string, string>;

export type FieldSpecConfig = {
	label: string;
	type?: HTMLInputTypeAttribute;
	placeholder?: string;
};

export type FieldSpecFn<T extends RawInput> = (
	key: string,
	input: RawInput,
	setInput: React.Dispatch<React.SetStateAction<T>>,
) => ReactNode;

export type FieldSetup<T extends RawInput> = {
	spec: FieldSpecConfig | FieldSpecFn<T>;
	required?: boolean;
};

type FieldSetupMap<T extends RawInput> = Record<keyof T, FieldSetup<T>>;

function defaultProcessInput<T extends Record<string, string>>(
	input: T,
	setupMap: FieldSetupMap<T>,
): string {
	const processedInput = Object.entries(setupMap).reduce(
		(acc, [key, setup]) => {
			const { spec } = setup as FieldSetup<T>;
			const { type } = spec as FieldSpecConfig;
			return {
				...acc,
				[key]:
					type === 'number'
						? Number(input[key as keyof T])
						: input[key as keyof T],
			};
		},
		{} as T,
	);
	return JSON.stringify(processedInput);
}

function getEmptyError<T extends Record<string, string>>(
	input: T,
	setupMap: FieldSetupMap<T>,
): Record<keyof T, string> {
	return Object.entries(setupMap).reduce((acc, [key, setup]) => {
		const { required } = setup as FieldSetup<T>;
		if (required && (input[key as keyof T] ?? '').trim() === '') {
			acc[key as keyof T] = `${key} is required`;
		}
		return acc;
	}, {} as Record<keyof T, string>);
}

const DEFAULT_SUBMIT_BUTTON_TEXT = 'Submit';
const DEFAULT_FIX_ERRORS_TEXT = 'Please fix the errors above.';

export interface InputFormProps<T extends Record<string, string>, R = void> {
	fieldSetup: FieldSetupMap<T>;
	mutateOptions: UseMutationOptions<R, unknown, string>;
	onProcessInput?: (input: T) => string;
	initialData?: T;
	submitButtonText?: ReactNode;
	fixErrorsText?: ReactNode;
}

/**
 * Provide a form to edit a record.
 * @template T - The type of the input object, it must be a record of strings representing the form fields and values.
 * @template R - The type of the response object of the react-query mutation. See [react-query useMutation](https://tanstack.com/query/latest/docs/react/reference/useMutation).
 * @param {InputFormProps<T, R>} props - The props for the Editor component.
 * @param {FieldSetupMap<T>} props.fieldSetup - The setup for the fields.
 *                                 if the spec is a function, it will be called with the key, input, and setInput and generate a custom field component.
 * 															   if the spec is an object, it represents the field spec config to generate a text field.
 * @param {UseMutationOptions<R, unknown, string>} props.mutateOptions - The options for the react-query mutation.
 *                                                 if the error of the mutation Promise contains a `fieldErrors` property, it will be used to display field errors.
 *                                                 the keys of the `fieldErrors` object must correspond to keys of the specified `props.fieldSetup`.
 * @param {(input: T) => string} [props.onProcessInput] - A function to process the raw form input into request body string before submitting.
 *                                                        if not provided, the default process will convert the input to a JSON string,
 * 																												any field with type `number` will be converted to number instead of a string
 * @param {T} [props.initialData] - The initial data for the input.
 * @param {ReactNode} [props.submitButtonText] - The text for the submit button, default to {@link DEFAULT_SUBMIT_BUTTON_TEXT}.
 * @param {ReactNode} [props.fixErrorsText] - The text to display when there are errors, default to {@link DEFAULT_FIX_ERRORS_TEXT}.
 * @returns
 */
export default function SimpleForm<T extends Record<string, string>, R = void>({
	fieldSetup,
	initialData,
	mutateOptions,
	onProcessInput,
	submitButtonText,
	fixErrorsText,
}: InputFormProps<T, R>): ReactElement {
	const [input, setInput] = useState<T>(
		initialData ||
			Object.keys(fieldSetup).reduce((acc, key) => {
				acc[key as keyof T] = '' as T[keyof T];
				return acc;
			}, {} as T),
	);
	const [fieldErrors, setFieldErrors] = useState<Record<keyof T, string>>(
		{} as Record<keyof T, string>,
	);
	const [mutateFieldErrors, setMutateFieldErrors] = useState<
		Record<keyof T, string>
	>({} as Record<keyof T, string>);

	const {
		mutate,
		isPending,
		error: responseError,
	} = useMutation<R, unknown, string>(mutateOptions) as UseMutationResult<R>;

	useEffect(() => {
		const responseFieldErrors =
			responseError && responseError && 'fieldErrors' in responseError
				? (responseError.fieldErrors as object)
				: {};
		setMutateFieldErrors(responseFieldErrors as Record<keyof T, string>);
	}, [responseError]);

	const combinedFieldErrors = useMemo(() => {
		return { ...fieldErrors, ...mutateFieldErrors };
	}, [fieldErrors, mutateFieldErrors]);

	const hasFieldError = useCallback(
		() =>
			Object.keys(fieldErrors).length > 0 ||
			Object.keys(mutateFieldErrors).length > 0,
		[fieldErrors, mutateFieldErrors],
	);

	const onSubmit = useCallback(() => {
		const error = getEmptyError(input, fieldSetup);
		setFieldErrors(error);
		if (Object.keys(error).length > 0) {
			return;
		}

		const submitInput = onProcessInput
			? onProcessInput(input)
			: defaultProcessInput(input, fieldSetup);
		mutate(submitInput);
	}, [fieldSetup, input, mutate, onProcessInput, setFieldErrors]);

	const onUpdate = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newInput = { ...input, [e.target.name]: e.target.value };
			setInput(newInput);
			setMutateFieldErrors({} as Record<keyof T, string>);
			const emptyError = getEmptyError(newInput, fieldSetup);
			setFieldErrors(emptyError);
		},
		[input, fieldSetup],
	);

	const submitButtonInner = submitButtonText ?? DEFAULT_SUBMIT_BUTTON_TEXT;
	const fixErrorsInner = fixErrorsText ?? DEFAULT_FIX_ERRORS_TEXT;

	return (
		<Stack spacing={2}>
			{Object.entries(fieldSetup).map(([key, setup]) => {
				const { spec, required } = setup as FieldSetup<T>;
				if (typeof spec === 'function') {
					return spec(key, input, setInput);
				}
				const { label, type, placeholder } = spec as FieldSpecConfig;
				return (
					<TextField
						key={key}
						name={key}
						type={type}
						label={label}
						placeholder={placeholder ?? label}
						fullWidth
						value={input[key as keyof T]}
						onChange={onUpdate}
						required={required}
						error={key in combinedFieldErrors}
						helperText={combinedFieldErrors[key as keyof T]}
					/>
				);
			})}
			{responseError?.message && (
				<Alert severity="error">{responseError.message}</Alert>
			)}
			{hasFieldError() && (
				<Alert severity="error">{fixErrorsInner}</Alert>
			)}
			<div>
				<Button
					onClick={onSubmit}
					disabled={isPending || hasFieldError()}
					variant="contained"
				>
					{submitButtonInner}
				</Button>
			</div>
			{isPending && <LinearProgress />}
		</Stack>
	);
}
