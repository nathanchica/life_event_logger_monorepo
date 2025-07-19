# Life Event Logger

React application for keeping track of various repeating life events by logging when they happen. Useful for remembering
the last time you did things that aren't typically tracked in a calendar app, such as cleaning your cats' litter boxes,
visiting the dentist, or getting boba. With this app, you can easily look up the last time these events happened and
stay on top of your routines.

Built with:
- create-react-app for bootstrapping a React application
- TypeScript for JS typing
- React hooks and Context API for state management
- GraphQL for fetching and persisting data
- Material UI for styled components
- Emotion CSS for custom css in Javascript
- yarn for package dependency management
- Husky, ESLint, and Prettier for maintaining code standards
- React Testing Library for testing frontend components

## Migrations

### Moment.js to date-fns (January 2025)

When this project started in 2022, Moment.js was the go-to date library. Since then, Moment.js entered maintenance mode and newer alternatives emerged. We migrated to date-fns for its smaller bundle size and modern, tree-shakeable architecture.

**Key changes:**
- Replaced `moment` with `date-fns` functions like `subDays()` and `isSameDay()`
- Updated MUI date adapter from `AdapterMoment` to `AdapterDateFns`
- Changed from Moment objects to native JavaScript Date objects