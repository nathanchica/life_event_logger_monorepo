import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.{ts,js}'],
            exclude: [
                'src/generated/**',
                'src/prisma/client.ts',
                '**/__mocks__/**',
                '**/*.test.{ts,js}',
                '**/*.spec.{ts,js}',
                'src/testSetup.ts'
            ]
        },
        setupFiles: ['./src/testSetup.ts']
    }
});
