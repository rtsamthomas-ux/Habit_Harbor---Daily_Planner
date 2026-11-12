# Habit Harbor

A calm, responsive daily planner and habit tracker for building routines at your own pace. Habit Harbor runs in the browser and stores planner data locally on each device.

**Live app:** [Open Habit Harbor](https://personal-planner-and-gjwc.bolt.host)

## Features

- Plan, schedule, sort, complete, reschedule, and undo daily tasks.
- Create recurring habits, record check-ins, skip a day, and view streaks.
- Set time goals and track time with manual entries or the built-in timer.
- Write dated notes, diary entries, and end-of-day reflections.
- See weekly activity and progress summaries.
- Get a short daily encouragement quote.
- Install the app as a Progressive Web App; the service worker caches the production app shell and local assets for offline use.
- Export and import a JSON backup to move data between devices.

## Data and privacy

Habit Harbor has no account, cloud sync, or server-side database. Tasks, habits, notes, diary entries, and progress are stored in the browser's local storage on the current device. Data does not sync automatically between a laptop and phone. Export a backup regularly; clearing this site's browser data can remove the local copy.

The app's source code and the planner data are separate: publishing or updating this repository does not upload a user's local planner data.

## Run locally

### Requirements

- Node.js and npm

### Setup

```bash
git clone https://github.com/rtsamthomas-ux/Harbor_Habit---Daily_Planner.git
cd Harbor_Habit---Daily_Planner
npm ci
npm run dev
```

Vite prints a local URL in the terminal. Open it in a browser to use the app.

## Available commands

```bash
npm run dev        # Start the local development server
npm run lint       # Check TypeScript and TSX files with ESLint
npm run typecheck  # Run the TypeScript type checker
npm run build      # Create the production site in dist/
npm run preview    # Preview the production build locally
```

## Build and deploy

Run `npm run build` and publish the generated `dist/` directory to a static web host. The app uses root-relative paths, so configure the host to serve the site at the domain root and to return `index.html` for app navigation routes. The service worker and web app manifest are in `public/` and are copied into `dist/` by Vite.

For offline use, open the hosted app online once so the service worker can install and cache the production app shell and local assets. Browser and operating-system install steps vary. Local planner data remains on each individual device, including while offline.

## Project structure

```text
src/
  components/   Shared interface components
  lib/          Data types, date helpers, browser storage, and daily quotes
  screens/       Today, Habits, Goals, Notes, Week, and Backup views
public/
  icons/        App and install icons
  manifest.webmanifest
  sw.js         Offline app-shell caching
.github/
  workflows/    Automated lint, type, and production-build checks
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and repository conventions.

## Security

See [SECURITY.md](SECURITY.md) for the app's data model and how to report a security concern.

## License

No license has been added yet. Until the repository owner chooses one, others should not assume they have permission to reuse or redistribute this code.
