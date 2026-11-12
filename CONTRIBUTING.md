# Contributing

Thanks for helping improve Habit Harbor. Keep changes focused, accessible, and compatible with the app's local-first data model.

## Development setup

1. Install Node.js and npm.
2. Clone the repository and run `npm ci`.
3. Start the app with `npm run dev`.

## Before opening a pull request

Run the project's existing quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

Describe the user-visible change and note any data-format, offline-caching, or backup behavior that changed. Do not commit secrets, personal planner exports, `node_modules/`, or generated `dist/` output.

## Design and data conventions

- Keep layouts usable on phone and laptop widths, with readable labels and keyboard-accessible controls.
- Preserve local browser storage unless a deliberate migration is included.
- Keep JSON backup import and export compatible with the app's `AppData` shape.
- Avoid adding account, analytics, cloud-sync, or paid-service dependencies without discussing the privacy and maintenance impact.
