import AnimatedLoadingBar from './common/AnimatedLoadingBar';
import { SchemaDataRow } from './data/SchemaCheckProvider';

import { Divider, List, ListItem } from '@mui/material';
import { ReactElement, ReactNode } from 'react';

export interface DataListProps<T = SchemaDataRow> {
	data: T[];
	makeItemContent: (item: T) => ReactNode;
	isLoading: boolean;
}

export default function DataList<T>({
	data,
	isLoading,
	makeItemContent,
}: DataListProps<T>): ReactElement {
	return (
		<List sx={{ p: 0 }}>
			<AnimatedLoadingBar isLoading={isLoading} />
			{(data ?? []).map((item, i) => (
				<div key={i}>
					<Divider />
					<ListItem>{makeItemContent(item)}</ListItem>
				</div>
			))}
		</List>
	);
}
