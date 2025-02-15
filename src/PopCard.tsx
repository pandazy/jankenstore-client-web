import { DataListProps } from './DataList';
import DataList from './DataList';

import {
	CardContent,
	CardContentProps,
	TypographyProps,
	CardProps,
} from '@mui/material';
import { Typography } from '@mui/material';
import { Card } from '@mui/material';

import { ReactElement, ReactNode } from 'react';

export interface PopCardProps {
	header?: ReactNode;
	titleTypographyProps?: TypographyProps;
	cardProps?: CardProps;
	cardContentProps?: CardContentProps;
	children?: React.ReactNode;
}

export default function PopCard({
	header,
	children,
	titleTypographyProps,
	cardProps,
	cardContentProps,
}: PopCardProps): ReactElement {
	return (
		<Card {...cardProps}>
			<Typography
				variant="caption"
				sx={{ p: 1 }}
				{...titleTypographyProps}
			>
				{header}
			</Typography>
			<CardContent
				sx={{ p: 0, maxHeight: 300, overflow: 'auto' }}
				{...cardContentProps}
			>
				{children}
			</CardContent>
		</Card>
	);
}

type PopCardListProps = PopCardProps & DataListProps;

export function PopCardList({
	header,
	data,
	isLoading,
	makeItemContent,
	children,
	...leftOverProps
}: PopCardListProps) {
	return (
		<PopCard header={header} {...leftOverProps}>
			<DataList
				data={data}
				isLoading={isLoading}
				makeItemContent={makeItemContent}
			/>
			{children}
		</PopCard>
	);
}
