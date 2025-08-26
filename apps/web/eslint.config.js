import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
    {
        ignores: [
            'node_modules/**',
            '.pnp',
            '.pnp.js',
            'coverage/**',
            'dist/**',
            'build/**',
            '.DS_Store',
            '.env.local',
            '.env.development.local',
            '.env.test.local',
            '.env.production.local',
            'npm-debug.log*',
            'yarn-debug.log*',
            'yarn-error.log*',
            '.pnp.*',
            '.yarn/**',
            '!.yarn/patches',
            '!.yarn/plugins',
            '!.yarn/releases',
            '!.yarn/sdks',
            '!.yarn/versions'
        ]
    },
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parser: typescriptParser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                ...globals.browser,
                ...globals.es2021,
                React: 'readonly',
                process: 'readonly'
            }
        },
        plugins: {
            '@typescript-eslint': typescript,
            'react': react,
            'react-hooks': reactHooks,
            'import': importPlugin
        },
        settings: {
            react: {
                version: 'detect'
            },
            'import/resolver': {
                typescript: {},
                node: {
                    extensions: ['.js', '.jsx', '.ts', '.tsx']
                }
            }
        },
        rules: {
            ...typescript.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'no-unused-vars': 'off',
            'react-hooks/exhaustive-deps': 'off',
            '@typescript-eslint/no-unused-vars': ['warn'],
            'import/order': [
                'warn',
                {
                    groups: ['builtin', 'external', 'internal', 'sibling', 'parent', 'index'],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: false
                    },
                    pathGroups: [
                        {
                            pattern: 'react',
                            group: 'external',
                            position: 'before'
                        },
                        {
                            pattern: 'react-dom/**',
                            group: 'external',
                            position: 'before'
                        }
                    ],
                    pathGroupsExcludedImportTypes: ['react']
                }
            ],
            'import/no-duplicates': 'error',
            'import/no-unused-modules': 'off',
            'react/prop-types': 'off',
            'react/display-name': 'off'
        }
    },
    {
        files: ['**/*.test.{js,jsx,ts,tsx}', '**/vitest.config.ts', '**/vite.config.ts', '**/test/**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.node,
                vi: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                global: 'readonly'
            }
        }
    }
];