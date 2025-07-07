/**
 * Simple smoke test for index.tsx
 *
 * For entry point files, we primarily want to ensure they can be loaded
 * without errors. The actual rendering behavior is better tested through
 * integration or e2e tests.
 */

// Mock external dependencies
jest.mock('@fontsource/roboto', () => ({}));
jest.mock('../index.css', () => ({}));

// Mock MUI CssBaseline
jest.mock('@mui/material/CssBaseline', () => ({
    __esModule: true,
    default: function CssBaseline() {
        return null;
    }
}));

// Mock React DOM to prevent actual rendering
jest.mock('react-dom/client', () => ({
    createRoot: jest.fn(() => ({
        render: jest.fn()
    }))
}));

// Mock the App component
jest.mock('../App', () => ({
    __esModule: true,
    default: function App() {
        return null;
    }
}));

describe('index.tsx', () => {
    beforeEach(() => {
        // Setup DOM environment
        document.body.innerHTML = '<div id="root"></div>';
    });

    afterEach(() => {
        // Clean up
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    it('bootstraps the application without errors', () => {
        // This smoke test ensures the entry point can be loaded and executed
        // without throwing errors, which is the main concern for index files
        expect(() => {
            jest.isolateModules(() => {
                // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
                require('../index.tsx');
            });
        }).not.toThrow();
    });
});
