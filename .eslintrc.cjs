module.exports = {
    env: {
        browser: true,
        es2021: true,
        jest: true
    },
    extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:jest/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript'
    ],
    overrides: [
        {
            files: ["**/*.test.js", "**/*.test.jsx", "**/*.test.ts", "**/*.test.tsx"],
            rules: {
                "react/prop-types": "off"
            }
        }
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['react', '@typescript-eslint', 'import'],
    rules: {
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
        'import/no-unused-modules': 'off'
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
    }
};
