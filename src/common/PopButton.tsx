import {
	Button,
	Popover,
	ButtonProps,
	PopoverProps,
	Tooltip,
} from '@mui/material';

import { ReactElement, useState } from 'react';

export type PopButtonProps = {
	buttonProps?: ButtonProps;
	popoverProps?: PopoverProps;
	popoverContent?: React.ReactNode;
	tooltip?: React.ReactNode;
	children: React.ReactNode;
};

export default function PopButton({
	children,
	popoverContent,
	popoverProps,
	buttonProps,
	tooltip,
}: PopButtonProps): ReactElement {
	const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
	const isOpen = Boolean(anchorEl);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
		buttonProps?.onClick?.(event);
	};

	const handleClose = (
		event: React.SyntheticEvent,
		reason: 'backdropClick' | 'escapeKeyDown',
	) => {
		setAnchorEl(null);
		popoverProps?.onClose?.(event, reason);
	};

	return (
		<>
			{popoverContent && (
				<Popover
					{...popoverProps}
					open={isOpen}
					onClose={handleClose}
					anchorEl={anchorEl}
					anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'left',
						...popoverProps?.anchorOrigin,
					}}
				>
					{popoverContent}
				</Popover>
			)}
			{tooltip ? (
				<Tooltip title={tooltip}>
					<Button {...buttonProps} onClick={handleClick}>
						{children}
					</Button>
				</Tooltip>
			) : (
				<Button {...buttonProps} onClick={handleClick}>
					{children}
				</Button>
			)}
		</>
	);
}
