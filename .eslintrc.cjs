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
        'plugin:jest/recommended'
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
    plugins: ['react', '@typescript-eslint'],
    rules: {
        'react/react-in-jsx-scope': 'off',
        'no-unused-vars': 'off',
        'react-hooks/exhaustive-deps': 'off',
        '@typescript-eslint/no-unused-vars': ['warn']
    },
    settings: {
        react: {
            version: 'detect'
        }
    }
};
