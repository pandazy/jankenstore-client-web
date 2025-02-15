import { build } from 'bun';
import PackageJson from './package.json';

await build({
	// Define the entry point
	target: 'browser',
	entrypoints: [
		'./src/index.ts',
		'./src/common/index.ts',
		'./src/data/index.ts',
		'./src/crud-ui/index.ts',
		'./src/nav/AvatarNav.tsx',
	],
	// Define the output directory
	outdir: './dist',
	splitting: true,
	external: Object.keys(PackageJson.peerDependencies),
	format: 'esm',
});
