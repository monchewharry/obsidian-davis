import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
	{
		ignores: ['node_modules', 'main.ts', 'main.js'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: 'module'
			},
			globals: {
				// equivalent to previous env: { node: true }
				process: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				module: 'readonly',
				require: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin
		},
		rules: {
			...tsPlugin.configs['recommended'].rules,
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
			'@typescript-eslint/ban-ts-comment': 'off',
			'no-prototype-builtins': 'off',
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-var-requires': 'off'
		}
	}
];
