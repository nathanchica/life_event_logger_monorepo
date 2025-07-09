import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import graphqlPlugin from '@graphql-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';

export default [
    js.configs.recommended,
    {
        files: ['src/**/*.{ts,js}', 'api/**/*.{ts,js}'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                project: './tsconfig.json'
            },
            globals: {
                process: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            import: importPlugin
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
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
            ]
        }
    },
    {
        files: ['**/*.graphql'],
        languageOptions: {
            parser: graphqlPlugin.parser
        },
        plugins: {
            '@graphql-eslint': graphqlPlugin
        },
        rules: {
            '@graphql-eslint/no-unreachable-types': 'error'
        }
    },
    {
        ignores: [
            'dist/',
            'node_modules/',
            '.vercel/',
            'coverage/',
            '*.config.js',
            '*.config.mjs',
            '*.config.ts',
            'src/generated/'
        ]
    }
];
