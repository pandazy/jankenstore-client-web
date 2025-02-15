import { createContext, useContext } from 'react';

import Result, { ResultType } from './result';
const { ok, err } = Result;

type ColumnType = 'INTEGER' | 'TEXT' | 'REAL' | 'BLOB' | 'REAL';

interface Schema {
	defaults: Record<string, number | string>;
	name: string;
	pk: string;
	requiredFields: string[];
	types: Record<string, ColumnType>;
}

type SchemaMap = Record<string, Schema>;

interface SchemaFamily {
	map: SchemaMap;
	children: Record<string, string[]>;
	parents: Record<string, string[]>;
	peers: Record<string, string[]>;
}

type DataRow = Record<string, number | string>;

function getSchema(schemaMap: SchemaMap, table: string): ResultType<Schema> {
	if (!(table in schemaMap)) {
		return err(
			new Error(
				`Schema '${table}' does not exist. Currently available schemas are: ${Object.keys(
					schemaMap,
				).join(', ')}`,
			),
		);
	}
	return ok(schemaMap[table]);
}

/**
 * Read value of a field from a source data
 * used in the context of a schema
 * For debugging purpose, error occurs if the specified field is not in the schema
 * @param param0
 * @returns
 */
function getProp({
	schemaFamily,
	prop,
	table,
	row,
	ignoreDefaults,
}: {
	schemaFamily: SchemaFamily;
	table: string;
	prop: string;
	row: DataRow;
	ignoreDefaults?: boolean;
}): ResultType<number | string> {
	const schemaResult = getSchema(schemaFamily.map, table);
	if (schemaResult.isErr()) return err(schemaResult.unwrapErr());
	const schema = schemaResult.unwrap();
	if (!(prop in schema.defaults)) {
		return err(
			new Error(
				`Schema '${schema.name}' does not have a field called '${prop}'`,
			),
		);
	}

	const rawData = row[prop];
	const result = ignoreDefaults ? rawData ?? schema.defaults[prop] : rawData;

	return ok(result);
}

/**
 * Get multiple properties from a source data
 * used in the context of a schema
 * For debugging purpose, error occurs if any of the specified fields are not in the schema
 * @param schemaFamily
 * @param table
 * @param props
 * @param row
 * @param ignoreDefaults
 */
function getProps({
	schemaFamily,
	table,
	props,
	row,
	ignoreDefaults,
}: {
	schemaFamily: SchemaFamily;
	table: string;
	props: string[];
	row: DataRow;
	ignoreDefaults?: boolean;
}): ResultType<DataRow> {
	const ret = {} as DataRow;
	for (const prop of props) {
		const propResult = getProp({
			schemaFamily,
			table,
			prop,
			row,
			ignoreDefaults,
		});
		if (propResult.isErr()) return err(propResult.unwrapErr());
		ret[prop] = propResult.unwrap();
	}
	return ok(ret);
}

/**
 * Error that occurs when trying to write to specific columns
 */
class ColumnWritingError extends Error {
	map: Record<string, string> = {};
}

/**
 * check schema for adding a new record
 * error occurs if there are errors such as missing required fields
 * a new record must have **all required fields'** value present and non-empty
 * @param schema
 * @param newRecord
 * @returns
 */
function checkNew(
	schema: Schema,
	newRecord: DataRow,
	ignoreDefaults: boolean = false,
): ResultType<DataRow> {
	const { requiredFields } = schema;
	const ret = {} as DataRow;
	if (!ignoreDefaults) {
		for (const [field, value] of Object.entries(schema.defaults)) {
			ret[field] = newRecord[field] ?? value;
		}
	} else {
		Object.assign(ret, newRecord);
	}

	const missing = requiredFields.filter(
		(requiredField) =>
			newRecord[requiredField] == null ||
			newRecord[requiredField].toString().trim() === '',
	);

	if (missing.length > 0) {
		const error = new ColumnWritingError(
			`When adding a new record, schema '${schema.name}' requires non-empty values for fields`,
		);
		error.map = missing.reduce((acc, field) => {
			acc[field] = "Can't be empty";
			return acc;
		}, {} as Record<string, string>);
		return err(error);
	}

	return ok(newRecord);
}

/**
 * check schema for updating a record
 * error occurs if there are errors such as missing required fields
 * an updated record needs to have **non-empty values** for required fields only if they are present
 * if a required field is not present in the source data, it is considered as not being updated, thus ignored
 * @param schema
 * @param recordToUpdate
 * @returns
 */
function checkUpdate(
	schema: Schema,
	recordToUpdate: DataRow,
	ignoreDefaults: boolean = false,
): ResultType<DataRow> {
	const { requiredFields } = schema;
	const ret = {} as DataRow;
	if (!ignoreDefaults) {
		for (const field of Object.keys(recordToUpdate)) {
			ret[field] = recordToUpdate[field] ?? schema.defaults[field];
		}
	} else {
		Object.assign(ret, recordToUpdate);
	}
	const emptyButRequired = requiredFields.filter(
		(requiredField) =>
			requiredField in recordToUpdate &&
			(recordToUpdate[requiredField] == null ||
				recordToUpdate[requiredField].toString().trim() === ''),
	);

	if (emptyButRequired.length > 0) {
		const error = new ColumnWritingError(
			`When updating a record, schema '${schema.name}' requires non-empty values for fields`,
		);
		error.map = emptyButRequired.reduce((acc, field) => {
			acc[field] = "Can't be empty";
			return acc;
		}, {} as Record<string, string>);
		return err(error);
	}
	return ok(ret);
}

/**
 * Check relationship between two schemas, where the each parent-type record can have multiple child-type records
 * @param schema
 * @param parentName
 * @returns
 */
function checkParentHood(
	schemaFamily: SchemaFamily,
	[parentTable, childTable]: [string, string],
): ResultType<undefined> {
	const { map: schemaMap, parents } = schemaFamily;
	const parentSchemaResult = getSchema(schemaMap, parentTable);
	if (parentSchemaResult.isErr()) return err(parentSchemaResult.unwrapErr());

	const childSchemaResult = getSchema(schemaMap, childTable);
	if (childSchemaResult.isErr()) return err(childSchemaResult.unwrapErr());

	if (!(parents[parentTable] ?? []).includes(childTable)) {
		return err(
			new Error(
				`Parent schema '${parentTable}' does not own child schema '${childTable}'`,
			),
		);
	}

	return ok(undefined);
}

function checkSiblingHood(
	schemaFamily: SchemaFamily,
	[table1, table2]: [string, string],
): ResultType<undefined> {
	const { map: schemaMap } = schemaFamily;
	const schema1Result = getSchema(schemaMap, table1);
	if (schema1Result.isErr()) return err(schema1Result.unwrapErr());

	const schema2Result = getSchema(schemaMap, table2);
	if (schema2Result.isErr()) return err(schema2Result.unwrapErr());

	if (table1 === table2) {
		return err(
			new Error(
				`Schema relationship '${table1} -> ${table2}' is not allowed`,
			),
		);
	}

	if (schemaFamily.peers[table1] !== schemaFamily.peers[table2]) {
		return err(
			new Error(
				`Schema relationship '${table1} -> ${table2}' is not found`,
			),
		);
	}

	return ok(undefined);
}

interface SchemaFamilyChecks {
	verifyTable: (table: string) => ResultType<boolean>;
	pk: (table: string, data: DataRow) => ResultType<string>;
	pkField: (table: string) => ResultType<string>;
	parents: (table: string) => string[];
	prop: (
		table: string,
		prop: string,
		data: DataRow,
		ignoreDefaults?: boolean,
	) => ResultType<number | string>;
	props: (
		table: string,
		props: string[],
		data: DataRow,
		ignoreDefaults?: boolean,
	) => ResultType<DataRow>;
	checkNew: (
		table: string,
		newRecord: DataRow,
		ignoreDefaults: boolean,
	) => ResultType<DataRow>;
	checkUpdate: (
		table: string,
		recordToUpdate: DataRow,
		ignoreDefaults: boolean,
	) => ResultType<DataRow>;
	checkParentHood: (
		parentTable: string,
		childTable: string,
	) => ResultType<undefined>;
	checkSiblingHood: (table1: string, table2: string) => ResultType<undefined>;
}

const DefaultErrorMessage =
	'Not implemented, please make sure SchemaCheckProvider is used';

const DefaultSchemaFamilyChecks: SchemaFamilyChecks = {
	verifyTable: () => err(new Error(DefaultErrorMessage)),
	pk: () => err(new Error(DefaultErrorMessage)),
	pkField: () => err(new Error(DefaultErrorMessage)),
	parents: () => [],
	prop: () => err(new Error(DefaultErrorMessage)),
	props: () => err(new Error(DefaultErrorMessage)),
	checkNew: () => err(new Error(DefaultErrorMessage)),
	checkUpdate: () => err(new Error(DefaultErrorMessage)),
	checkParentHood: () => err(new Error(DefaultErrorMessage)),
	checkSiblingHood: () => err(new Error(DefaultErrorMessage)),
};

export function makeSchemaFamilyChecks(
	schemaFamily: SchemaFamily,
): SchemaFamilyChecks {
	const copiedFamily = JSON.parse(JSON.stringify(schemaFamily));
	return {
		verifyTable: (table: string) => {
			const { map } = copiedFamily;
			if (!(table in map)) {
				return err(new Error(`Schema table '${table}' does not exist`));
			}
			return ok(true);
		},
		parents: (table: string) => {
			const { parents } = copiedFamily;
			return parents[table] ?? [];
		},
		pkField: (table: string) => {
			const schemaResult = getSchema(copiedFamily.map, table);
			if (schemaResult.isErr()) return err(schemaResult.unwrapErr());
			const schema = schemaResult.unwrap();
			return ok(schema.pk);
		},
		pk: (table: string, data: DataRow) => {
			const schemaResult = getSchema(copiedFamily.map, table);
			if (schemaResult.isErr()) return err(schemaResult.unwrapErr());
			const schema = schemaResult.unwrap();
			const pkField = schema.pk;
			if (!(pkField in data)) {
				return err(
					new Error(
						`Primary key field '${pkField}' not found in data`,
					),
				);
			}
			const pkValue = data[pkField];
			if (typeof pkValue !== 'string' || pkValue.trim() === '') {
				return err(
					new Error(`Primary key field '${pkField}' is empty`),
				);
			}
			return ok(pkValue);
		},
		prop: (table, prop, data, ignoreDefaults = false) =>
			getProp({
				schemaFamily: copiedFamily,
				table,
				prop,
				row: data,
				ignoreDefaults,
			}),

		props: (table, props, data, ignoreDefaults = false) =>
			getProps({
				schemaFamily: copiedFamily,
				table,
				props,
				row: data,
				ignoreDefaults,
			}),
		checkNew: (table, newRecord, ignoreDefaults) => {
			const schemaResult = getSchema(copiedFamily.map, table);
			if (schemaResult.isErr()) return err(schemaResult.unwrapErr());
			return checkNew(schemaResult.unwrap(), newRecord, ignoreDefaults);
		},

		checkUpdate: (table, recordToUpdate, ignoreDefaults) => {
			const schemaResult = getSchema(copiedFamily.map, table);
			if (schemaResult.isErr()) return err(schemaResult.unwrapErr());
			return checkUpdate(
				schemaResult.unwrap(),
				recordToUpdate,
				ignoreDefaults,
			);
		},

		checkParentHood: (parentTable, childTable) =>
			checkParentHood(copiedFamily, [parentTable, childTable]),

		checkSiblingHood: (table1, table2) =>
			checkSiblingHood(copiedFamily, [table1, table2]),
	};
}

const SchemaCheckContext = createContext(DefaultSchemaFamilyChecks);

function useSchemaChecks() {
	return useContext(SchemaCheckContext);
}

function useSchemaProps({
	table,
	props,
	data,
	ignoreDefaults = false,
	enabled = true,
}: {
	table: string;
	props: string[];
	data: DataRow;
	ignoreDefaults?: boolean;
	enabled?: boolean;
}): { props?: DataRow; error?: Error; hasError: boolean } {
	const { props: getProps } = useSchemaChecks();
	if (!enabled) {
		return { hasError: false };
	}
	const propsResult = getProps(table, props, data, ignoreDefaults);
	if (propsResult.isErr()) {
		return {
			props: undefined,
			error: propsResult.unwrapErr(),
			hasError: true,
		};
	}
	return { props: propsResult.unwrap(), hasError: false };
}

function useSchemaPk(
	table: string,
	data: DataRow,
	enabled: boolean = true,
): { pk?: string; hasError: boolean; error?: Error } {
	const { pk } = useSchemaChecks();
	if (!enabled) {
		return { hasError: false };
	}
	const pkResult = pk(table, data);
	if (pkResult.isErr()) {
		return { hasError: true, error: pkResult.unwrapErr() };
	}
	const pkValue = pkResult.unwrap();
	if (pkValue == null || String(pkValue).trim() === '') {
		return { hasError: true, error: new Error('Primary key is empty') };
	}
	return { hasError: false, pk: pkValue };
}

function SchemaCheckProvider({
	schemaFamily,
	children,
}: {
	schemaFamily: SchemaFamily;
	children: React.ReactNode;
}) {
	return (
		<SchemaCheckContext.Provider
			value={makeSchemaFamilyChecks(schemaFamily)}
		>
			{children}
		</SchemaCheckContext.Provider>
	);
}

export {
	SchemaCheckProvider as default,
	SchemaFamilyChecks,
	useSchemaChecks,
	useSchemaProps,
	useSchemaPk,
	SchemaFamily,
	Schema,
	SchemaMap,
	DataRow as SchemaDataRow,
	ColumnWritingError,
};
