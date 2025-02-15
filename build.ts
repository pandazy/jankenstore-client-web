import { build } from 'bun';
import PackageJson from './package.json';

await build({
	// Define the entry point
	target: 'browser',
	entrypoints: [
		'./src/index.ts',
		'./src/data/result.ts',
		'./src/crud-ui/SimpleForm.tsx',
		'./src/crud-ui/DebouncedTextField.tsx',
		'./src/nav/AvatarNav.tsx',
	],
	// Define the output directory
	outdir: './dist',
	splitting: true,
	external: Object.keys(PackageJson.peerDependencies),
	format: 'esm',
});
