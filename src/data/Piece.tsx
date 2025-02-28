import { useSchemaChecks, SchemaDataRow } from './SchemaCheckProvider';

import { Alert } from '@mui/material';

export default function Piece<T = SchemaDataRow>({
	table,
	srcRow,
	col,
}: {
	table: string;
	srcRow: T;
	col: string;
}): React.ReactNode {
	const { prop } = useSchemaChecks();
	const result = prop(table, col, srcRow as SchemaDataRow);
	if (result.isErr()) {
		return <Alert severity="error">{result.unwrapErr().message}</Alert>;
	}
	return <>{result.unwrap()}</>;
}
