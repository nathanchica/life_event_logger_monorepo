import { createRoot } from 'react-dom/client';

// Mock createRoot
jest.mock('react-dom/client', () => ({
    createRoot: jest.fn()
}));

// Mock App component
jest.mock('../App', () => {
    return function MockApp() {
        return <div data-testid="app">Mock App</div>;
    };
});

// Mock CSS imports
jest.mock('@fontsource/roboto', () => ({}));
jest.mock('../index.css', () => ({}));

describe('index.tsx', () => {
    const mockRender = jest.fn();
    const mockCreateRoot = createRoot;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateRoot.mockReturnValue({ render: mockRender });
    });

    it('creates root with correct element and renders App', () => {
        // Mock document.getElementById
        const mockRootElement = document.createElement('div');
        mockRootElement.id = 'root';
        jest.spyOn(document, 'getElementById').mockReturnValue(mockRootElement);

        // Import index.tsx to trigger the render
        jest.isolateModules(() => {
            require('../index.tsx');
        });

        expect(mockCreateRoot).toHaveBeenCalledWith(mockRootElement);
        expect(mockRender).toHaveBeenCalledTimes(1);

        const renderCall = mockRender.mock.calls[0][0];
        expect(renderCall.props.children.type.name).toBe('MockApp');
    });
});
