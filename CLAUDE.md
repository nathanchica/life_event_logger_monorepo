# Testing Guidelines for Life Event Logger

## Test Structure and Best Practices

### 1. Use Mock Data Factories
Always use the mock data factories from `src/mocks/` instead of creating inline test data:

```javascript
import { createMockLoggableEvent } from '../../../mocks/loggableEvent';
import { createMockEventLabel } from '../../../mocks/eventLabels';
import { createMockUser } from '../../../mocks/user';
import { 
  createMockLoggableEventsContextValue,
  createMockAuthContextValue,
  createMockViewOptionsContextValue 
} from '../../../mocks/providers';
```

### 2. Use Context Providers Directly
Instead of mocking entire modules, use the actual Context.Provider with mock values:

```javascript
import { LoggableEventsContext } from '../../../providers/LoggableEventsProvider';
import { AuthContext } from '../../../providers/AuthProvider';
import { ViewOptionsContext } from '../../../providers/ViewOptionsProvider';

const mockContextValue = createMockLoggableEventsContextValue({
  loggableEvents: [mockEvent],
  updateLoggableEventDetails: mockUpdateFunction
});

const renderWithProviders = (component) => {
  return render(
    <LoggableEventsContext.Provider value={mockContextValue}>
      {component}
    </LoggableEventsContext.Provider>
  );
};
```

### 3. Testing File Conventions
- Test files should be placed in `__tests__` directories next to the components they test
- Use `.test.js` extension for test files
- Name test files after the component they test (e.g., `EventRecord.test.js` for `EventRecord.tsx`)

### 4. Test Consolidation and Organization

#### Use it.each for Similar Tests
Consolidate similar tests using `it.each` to reduce duplication:

```javascript
// Good - Consolidated tests with description first
it.each([
  ['Work label', 'work-label', '#1976d2'],
  ['Personal label', 'personal-label', '#388e3c'],
  ['Health label', 'health-label', '#d32f2f']
])('renders %s with correct color', (description, labelId, expectedColor) => {
  const mockLabel = createMockEventLabel({ id: labelId, name: description.split(' ')[0], color: expectedColor });
  renderWithProviders(<EventLabel label={mockLabel} />);
  
  const label = screen.getByText(description.split(' ')[0]);
  expect(label).toBeInTheDocument();
  expect(label).toHaveStyle({ backgroundColor: expectedColor });
});

// Good - When description is only for test name, use underscore for unused parameter
it.each([
  ['empty disabled dates', []],
  ['single disabled date', [new Date('2023-01-01')]],
  ['multiple disabled dates', [date1, date2, date3]]
])('handles %s', (_, dates) => {
  renderWithProviders(<EventDatepicker disabledDates={dates} />);
  expect(screen.getByLabelText(/event date/i)).toBeInTheDocument();
});

// Bad - Repetitive tests
it('renders Work label', () => {
  const mockLabel = createMockEventLabel({ id: 'work-label', name: 'Work', color: '#1976d2' });
  renderWithProviders(<EventLabel label={mockLabel} />);
  expect(screen.getByText('Work')).toBeInTheDocument();
});

it('renders Personal label', () => {
  const mockLabel = createMockEventLabel({ id: 'personal-label', name: 'Personal', color: '#388e3c' });
  renderWithProviders(<EventLabel label={mockLabel} />);
  expect(screen.getByText('Personal')).toBeInTheDocument();
});
```

#### it.each Best Practices
- Put descriptive strings first in the array for better test output
- Use underscore (`_`) for unused parameters instead of naming them
- Keep test data arrays readable and well-formatted
- Avoid using objects as the first parameter as they don't display well in test names

#### Avoid Conditionals in Tests
Never put `expect()` statements inside conditionals:

```javascript
// Bad - expect inside conditional
it('renders label if provided', () => {
  const { label } = props;
  if (label) {
    expect(screen.getByText(label)).toBeInTheDocument();
  }
});

// Bad - Still has expect inside conditional
it.each([
  ['with label', { label: 'Test Label' }, true],
  ['without label', { label: undefined }, false]
])('renders component %s', (testName, props, shouldShowLabel) => {
  renderWithProviders(<Component {...props} />);
  
  const label = screen.queryByText(props.label || '');
  if (shouldShowLabel) {
    expect(label).toBeInTheDocument();
  } else {
    expect(label).not.toBeInTheDocument();
  }
});

// Good - Separate tests with clear expectations
describe('Component label rendering', () => {
  it('renders label when provided', () => {
    renderWithProviders(<Component label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });
  
  it('does not render label when not provided', () => {
    renderWithProviders(<Component />);
    expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
  });
});

// Good - Using it.each without conditionals
it.each([
  ['Test Label', 'Test Label'],
  ['Another Label', 'Another Label'],
  ['Special!@#', 'Special!@#']
])('renders label with text "%s"', (labelText, expectedText) => {
  renderWithProviders(<Component label={labelText} />);
  expect(screen.getByText(expectedText)).toBeInTheDocument();
});

// Good - Testing presence/absence with it.each
it.each([
  ['when label is provided', 'Test Label', true],
  ['when label is empty string', '', false],
  ['when label is whitespace', '   ', false]
])('%s', (testCase, labelValue, shouldRender) => {
  renderWithProviders(<Component label={labelValue} />);
  
  // Use ternary in the assertion, not around the expect
  expect(screen.queryByTestId('label')).toBe(shouldRender ? expect.anything() : null);
});
```

### 5. Function Argument Patterns

#### Prefer Single Options Object for renderWithProviders
Use a single options object instead of multiple parameters for better maintainability and readability:

```javascript
// Good - Single options object
const renderWithProviders = (options = {}) => {
  const { 
    viewOptionsValue = {}, 
    loggableEvents = mockLoggableEvents,
    skipCachePrepopulation = false,
    authValue = {},
    theme = 'light'
  } = options;
  
  // ... rest of function
};

// Usage
renderWithProviders({ 
  viewOptionsValue: { activeEventLabelId: 'label-1' },
  loggableEvents: customEvents 
});

renderWithProviders({ skipCachePrepopulation: true });

// Bad - Multiple separate parameters
const renderWithProviders = (
  viewOptionsValue = {}, 
  loggableEvents = mockLoggableEvents, 
  skipCache = false
) => {
  // ... function body
};

// Usage is less clear and order-dependent
renderWithProviders({ activeEventLabelId: 'label-1' }, customEvents, true);
```

**Benefits of options object pattern:**
- **Named parameters** - Clear what each option does
- **Order independent** - Can pass options in any order
- **Extensible** - Easy to add new options without breaking existing calls
- **Optional parameters** - Only specify what you need to change
- **Self-documenting** - Code reads like configuration

#### Apply to Other Test Helper Functions
Use the same pattern for other test utilities:

```javascript
// Good
const createMockEvent = (options = {}) => {
  const { name = 'Default Event', labels = [], timestamps = [] } = options;
  return { id: 'event-1', name, labels, timestamps };
};

// Usage
createMockEvent({ name: 'Custom Event', labels: [label1] });

// Bad
const createMockEvent = (name = 'Default Event', labels = [], timestamps = []) => {
  return { id: 'event-1', name, labels, timestamps };
};
```

### 6. Mock Function Best Practices
- Always clear mocks before each test:
```javascript
beforeEach(() => {
  jest.clearAllMocks();
});
```

- Create mock functions at the describe block level when shared across tests:
```javascript
describe('ComponentName', () => {
  const mockUpdateFunction = jest.fn();
  const mockDeleteFunction = jest.fn();
  // ... tests
});
```

### 7. Testing User Interactions

#### Prefer userEvent over fireEvent
Use `@testing-library/user-event` for more realistic user interactions:

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('handles user interactions', async () => {
    renderWithProviders(<Component />);

    // Click interactions
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Type interactions
    await user.type(screen.getByLabelText(/name/i), 'New Name');

    // Clear and type
    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');

    // Select text in input
    await user.selectOptions(screen.getByRole('combobox'), ['option-value']);

    // Hover interactions
    await user.hover(screen.getByText('Hover me'));
    await user.unhover(screen.getByText('Hover me'));

    // Keyboard interactions
    await user.keyboard('{Enter}');
    await user.keyboard('{Escape}');
  });
});
```

#### When to use fireEvent
Only use fireEvent for edge cases where userEvent doesn't support the interaction:

```javascript
import { fireEvent } from '@testing-library/react';

// For specific events not covered by userEvent
fireEvent.focus(element);
fireEvent.blur(element);
fireEvent.mouseEnter(element);
fireEvent.mouseLeave(element);
```

### 8. Common Test Patterns

#### Testing with Multiple Providers
When a component needs multiple contexts:
```javascript
const renderWithProviders = (component) => {
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <LoggableEventsContext.Provider value={mockEventsValue}>
        <ViewOptionsContext.Provider value={mockViewValue}>
          {component}
        </ViewOptionsContext.Provider>
      </LoggableEventsContext.Provider>
    </AuthContext.Provider>
  );
};
```

#### Testing GraphQL Components with Cache Prepopulation
For components using Apollo Client fragments, prefer cache prepopulation over mocked queries:

```javascript
import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';

describe('ComponentName', () => {
  let apolloCache;
  const mockUserFragment = createMockUserFragment({ id: 'user-1' });

  const renderWithProviders = (options = {}) => {
    const { 
      viewOptionsValue = {}, 
      loggableEvents = mockLoggableEvents,
      skipCachePrepopulation = false 
    } = options;
    
    apolloCache = new InMemoryCache();
    
    // Write fragment data to cache to simulate loaded state
    if (!skipCachePrepopulation) {
      apolloCache.writeFragment({
        id: apolloCache.identify(mockUserFragment),
        fragment: ComponentName.fragments.fragmentName,
        data: {
          __typename: 'User',
          loggableEvents
        }
      });
    }

    return render(
      <MockedProvider cache={apolloCache} addTypename={false}>
        <AuthContext.Provider value={mockAuthValue}>
          <ViewOptionsContext.Provider value={mockViewOptionsValue}>
            {component}
          </ViewOptionsContext.Provider>
        </AuthContext.Provider>
      </MockedProvider>
    );
  };

  afterEach(() => {
    if (apolloCache) {
      apolloCache.reset();
    }
  });

  // Test when fragment is complete (cache populated)
  it('renders data when fragment is complete', () => {
    renderWithProviders();
    expect(screen.getByText('Expected Content')).toBeInTheDocument();
  });

  // Test when fragment is incomplete (cache not populated)
  it('renders empty state when fragment is incomplete', () => {
    renderWithProviders({ skipCachePrepopulation: true });
    const items = screen.queryAllByRole('listitem');
    expect(items).toHaveLength(0);
  });
});
```

**Why use cache prepopulation over mocked queries:**
- More accurately simulates real Apollo Client behavior
- Tests the actual `useFragment` hook behavior 
- Allows testing incomplete fragment states (loading states)
- Doesn't require complex query mocking setup
- Tests integration with actual GraphQL fragments

### 9. Common Testing Utilities

#### Testing with User-Centric Queries
```javascript
// Prefer user-visible text
expect(screen.getByText('Submit')).toBeInTheDocument();

// Use accessible queries
expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

// For elements with aria-label but no accessible name
expect(screen.getByLabelText(/cancel date selection/i)).toBeInTheDocument();

// Query by test id only as last resort
expect(screen.getByTestId('custom-element')).toBeInTheDocument();

// AVOID querySelector - use Testing Library queries instead
// Bad
const element = container.querySelector('.MuiStack-root');

// Good
const element = screen.getByRole('group');
```

#### Testing Visibility and Hidden Elements

When testing element visibility, understand the difference between existence and visibility:

```javascript
// Element exists in DOM but may not be visible
expect(element).toBeInTheDocument();

// Element is visible to users
expect(element).toBeVisible();

// Element is in DOM but not visible
expect(element).not.toBeVisible();
```

For hidden elements (like in collapsed states), you may need to use the `hidden` option:

```javascript
// Bad - Will fail if element is hidden
const button = screen.getByRole('button', { name: /cancel/i });

// Good - Finds hidden elements when needed
const button = screen.getByRole('button', { name: /cancel/i, hidden: true });

// Alternative - Use getByLabelText for elements with aria-label
const button = screen.getByLabelText(/cancel date selection/i);
```

#### Testing MUI Collapse Components
When testing Material-UI Collapse components, use `toBeVisible()` instead of `toBeInTheDocument()`:

```javascript
// Bad - Element is always in the document, just hidden
it('shows content when expanded', () => {
  renderWithProviders(<CollapsibleSection />);
  const content = screen.getByTestId('collapsible-content');
  expect(content).toBeInTheDocument(); // This will pass even when collapsed!
});

// Good - Properly tests visibility
it('shows content when expanded', async () => {
  renderWithProviders(<CollapsibleSection />);
  const toggleButton = screen.getByRole('button', { name: /expand/i });
  
  // Content should be hidden initially
  expect(screen.getByTestId('collapsible-content')).not.toBeVisible();
  
  // Click to expand
  await user.click(toggleButton);
  
  // Content should now be visible
  expect(screen.getByTestId('collapsible-content')).toBeVisible();
});

// Good - Testing visibility states without conditionals
it('shows content when isShowing is true', () => {
  renderWithProviders(<Component isShowing={true} />);
  expect(screen.getByLabelText(/event date/i)).toBeVisible();
});

it('hides content when isShowing is false', () => {
  renderWithProviders(<Component isShowing={false} />);
  const element = screen.getByLabelText(/event date/i);
  expect(element).toBeInTheDocument();
  expect(element).not.toBeVisible();
});
```

#### Date Testing
When testing components that use dates:
```javascript
const testDate = new Date('2023-01-01T00:00:00Z');
const mockEvent = createMockLoggableEvent({
  timestamps: [testDate]
});
```

#### Testing Async Operations
For components with async operations:
```javascript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(mockFunction).toHaveBeenCalled();
});

// For userEvent async operations
await user.click(submitButton);
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### 10. Known Issues and Workarounds

#### Material-UI Act Warnings
The project uses Material-UI which can cause "act" warnings in tests. These are generally harmless and relate to internal MUI state updates. Focus on actual test failures rather than these warnings.

#### TypeScript in Tests
Test files use `.js` extension but can still import TypeScript files. Type checking is not enforced in test files.


### 11. Running Tests
```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run a specific test file
yarn test src/components/EventCards/__tests__/EventRecord.test.js

# Run tests with coverage
yarn test --coverage
```

### 12. Testing Complex Components

When testing components that integrate with complex third-party libraries (like MUI date pickers):

#### Prefer Real Components Over Mocks
```javascript
// Good - Test with the actual component
it('accepts current date when picker is used', async () => {
  renderWithProviders();
  
  const dateInput = screen.getByLabelText(/event date/i);
  await user.click(dateInput);
  
  // Interact with the actual MUI dialog
  const okButton = await screen.findByRole('button', { name: /ok/i });
  if (okButton) {
    await user.click(okButton);
    expect(mockOnAccept).toHaveBeenCalled();
  }
});

// Bad - Mocking the entire component
jest.mock('@mui/x-date-pickers/MobileDatePicker', () => ({
  MobileDatePicker: MockComponent
}));
```

#### Testing Principles for Complex Components
1. **Real User Interactions** - Simulate what users actually do rather than calling handlers directly
2. **No Mocking When Possible** - Test with real components to ensure integration works correctly
3. **Pragmatic Approach** - Use `findBy` queries for elements that appear asynchronously (like dialogs)
4. **Accept Testing Limitations** - Some internal callbacks may be difficult to test without mocking; focus on user-facing behavior instead

#### When Testing is Challenging
If achieving 100% coverage requires complex mocking:
1. First try interacting with the real component
2. Look for accessible elements (buttons, inputs) in rendered dialogs/modals
3. Use `findBy` queries for async elements
4. Consider if the untested code is critical - internal implementation details may not need testing
5. Document why certain lines can't be tested without mocking

### 13. Test Coverage Goals
- Aim for high coverage on business logic and user interactions
- Don't test implementation details
- Focus on testing behavior, not internal state
- Prioritize testing:
  - User interactions and workflows
  - Business logic and data transformations
  - Error states and edge cases
  - Accessibility features
- For complex third-party integrations:
  - Test the integration points
  - Verify user-facing behavior
  - Don't mock unless absolutely necessary