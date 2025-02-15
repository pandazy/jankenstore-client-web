import { TextField, TextFieldProps } from '@mui/material';
import { ChangeEvent, ReactElement } from 'react';

const DEFAULT_DEBOUNCE_DELAY = 500;

export interface SearchInputProps {
	textFieldProps: TextFieldProps;
	debounceDelay?: number;
}

export default function DebouncedTextField({
	debounceDelay,
	textFieldProps,
}: SearchInputProps): ReactElement {
	let debounceTimeHandle: Timer;
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		clearTimeout(debounceTimeHandle);
		debounceTimeHandle = setTimeout(
			() => textFieldProps?.onChange?.(e),
			debounceDelay || DEFAULT_DEBOUNCE_DELAY,
		);
	};
	return <TextField {...textFieldProps} onChange={handleChange} />;
}
