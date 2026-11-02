import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/**
 * Konfigurasi ESLint paket ini (self-contained, tidak bergantung pada config root).
 */
export default tseslint.config(
	{
		ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.d.ts'],
	},

	js.configs.recommended,

	...tseslint.configs.recommended.map((cfg) => ({
		...cfg,
		files: ['**/*.ts', '**/*.tsx'],
	})),

	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parserOptions: { ecmaFeatures: { jsx: true } },
		},
		rules: {
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
			],
			// Utang teknis yang dibayar bertahap: peringatan, bukan blocker CI.
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-empty-object-type': 'warn',
			'@typescript-eslint/no-require-imports': 'warn',
			'@typescript-eslint/no-namespace': 'warn',
			'@typescript-eslint/no-unused-expressions': 'warn',
		},
		linterOptions: {
			reportUnusedDisableDirectives: 'warn',
		},
	},

	// Aplikasi React (web)
	{
		files: ['src/**/*.{ts,tsx}'],
		languageOptions: {
			globals: { ...globals.browser },
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
		},
		rules: {
			...reactHooks.configs.recommended.rules,
			'react-refresh/only-export-components': 'off',
			// Aturan React Compiler (v7) bernilai tinggi tetapi masih utang teknis.
			// `rules-of-hooks` tetap error karena pelanggarannya benar-benar crash.
			'react-hooks/set-state-in-effect': 'warn',
			'react-hooks/refs': 'warn',
			'react-hooks/immutability': 'warn',
			'react-hooks/preserve-manual-memoization': 'warn',
			'react-hooks/purity': 'warn',
			'react-hooks/set-state-in-render': 'warn',
			'react-hooks/static-components': 'warn',
			'react-hooks/use-memo': 'warn',
			'react-hooks/globals': 'warn',
			'react-hooks/error-boundaries': 'warn',
			'react-hooks/incompatible-library': 'warn',
			'react-hooks/config': 'warn',
			'react-hooks/gating': 'warn',
		},
	},

	// File konfigurasi (vite, dll.) berjalan di Node.
	{
		files: ['*.config.{js,mjs,ts}', 'vite.config.ts'],
		languageOptions: { globals: { ...globals.node } },
		rules: { 'no-undef': 'off' },
	},
);
