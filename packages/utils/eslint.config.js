import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
    {
        ignores: [
            'node_modules/**',
            'coverage/**',
            'dist/**',
            'build/**',
            '.DS_Store',
            '*.log*'
        ]
    },
    js.configs.recommended,
    {
        files: ['**/*.{js,ts}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parser: typescriptParser,
            globals: {
                ...globals.node,
                ...globals.es2021
            }
        },
        plugins: {
            '@typescript-eslint': typescript,
            'import': importPlugin
        },
        settings: {
            'import/resolver': {
                typescript: {},
                node: {
                    extensions: ['.js', '.ts']
                }
            }
        },
        rules: {
            ...typescript.configs.recommended.rules,
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn'],
            'import/order': [
                'warn',
                {
                    groups: ['builtin', 'external', 'internal', 'sibling', 'parent', 'index'],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: false
                    }
                }
            ],
            'import/no-duplicates': 'error',
            'import/no-unused-modules': 'off'
        }
    },
    {
        files: ['**/*.test.{js,ts}', '**/vitest.config.ts'],
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
                afterAll: 'readonly'
            }
        }
    }
];