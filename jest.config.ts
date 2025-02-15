import type { Config } from 'jest';

const config: Config = {
	testEnvironment: 'jsdom',
	verbose: true,
	roots: ['<rootDir>/src', '<rootDir>/__tests__'],
	moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
	moduleNameMapper: {
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'<rootDir>/__mocks__/fileMock.js',
	},
	testMatch: [
		'**/__tests__/**/*.[jt]s?(x)',
		'**/?(*.)+(spec|test).[jt]s?(x)',
	],
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
	},
	transformIgnorePatterns: [
		'<rootDir>/node_modules/(?!@?react-spring|@?react-native)',
	],
	testPathIgnorePatterns: ['/node_modules/'],
	setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
	coveragePathIgnorePatterns: [
		'/node_modules/',
		'/__tests__/utils/',
		'/__mocks__/',
		'/*.test.ts',
		'/*.test.tsx',
		'/*.test.js',
		'/*.test.jsx',
	],
	collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
	coverageDirectory: '<rootDir>/coverage',
	coverageReporters: ['json', 'lcov', 'text', 'clover'],
};

export default config;
