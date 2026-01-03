# Journal MVP

An offline-first desktop journal application built with Electron and React. All entries are stored locally as Markdown files.

## Features

### Core (MVP)
- **Local-first storage**: All entries saved as `.md` files in a user-chosen folder
- **Directory tree sidebar**: Browse entries by folders and dates
- **Full-text search**: Search across all journal entries
- **Markdown editor**: Write entries with markdown support

### AI Features (Optional, Off by Default)
AI features focus on organization and pattern recognition—no therapy, no diagnosis, no clinical language. All AI outputs include confidence levels and 1-3 evidence quotes.

1. **Daily Review**: Summary of a selected day's entries
2. **Weekly Summary**: Overview of a selected week
3. **Highlights Extractor**: Topics, wins, friction points, explicit action items
4. **Open Loops Tracker**: Unresolved items across entries
5. **Question of the Day**: Reflective prompt based on last 3 days

## Storage Structure

```
<user-chosen-folder>/
├── entries/
│   └── YYYY/
│       └── MM/
│           └── YYYY-MM-DD.md
├── ai/
│   ├── daily/
│   │   └── YYYY-MM-DD.review.md
│   ├── weekly/
│   │   └── YYYY-W##.summary.md
│   ├── highlights/
│   │   └── YYYY-MM-DD.highlights.md
│   ├── loops/
│   │   └── open_loops.json
│   └── questions/
│       └── YYYY-MM-DD.question.md
└── settings.json
```

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
npm install
```

### Run in Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Tech Stack

- **Electron**: Desktop application framework
- **React**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **CodeMirror**: Markdown editor
- **date-fns**: Date utilities

## Project Structure

```
src/
├── main/              # Electron main process
│   ├── index.ts       # Main entry point
│   └── ipc.ts         # IPC handlers
├── renderer/          # React application
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Root component
│   └── index.tsx      # Renderer entry
├── shared/            # Shared types and constants
│   └── types.ts
└── preload/           # Preload scripts
    └── index.ts
```

## License

MIT
