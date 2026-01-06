# MindPlus - Intelligent Journal

An offline-first, privacy-focused desktop journal application built with Electron and React. All entries are stored locally as Markdown files with enterprise-grade security and AI-powered insights.

## ✨ Features

### 📝 Core Journaling
- **Local-first storage**: All entries saved as `.md` files in a user-chosen folder
- **Directory tree sidebar**: Browse entries by folders and dates
- **Full-text search**: Search across all journal entries
- **Markdown editor**: Write entries with markdown support
- **Quick switcher**: Cmd/Ctrl+K to quickly navigate entries

### 🔒 Privacy & Security (Sprint 5)
- **App Lock**: PBKDF2-encrypted passcode protection with auto-lock
- **Sensitive Entries**: Per-entry privacy with unlock confirmation
- **No Cloud Sync**: All data stays on your device
- **No Telemetry**: Usage stats are local-only
- **Transparent**: Full data transparency in settings

### 🎨 Personalization (Sprint 5)
**Editor Preferences:**
- Font family (Default, Serif, Monospace)
- Font size (Small, Medium, Large)
- Line width (Narrow, Medium, Wide)
- Distraction-free mode

**AI Style Preferences:**
- Tone (Neutral, Analytical, Reflective)
- Verbosity (Concise, Balanced, Detailed)
- Evidence strictness (Standard, Strict)

**UI Themes:**
- Default Light
- Calm Light
- Soft Dark
- System (auto-detect)

### 🤖 AI Features (Optional, Off by Default)
AI features focus on organization and pattern recognition—no therapy, no diagnosis, no clinical language. All AI outputs include confidence levels and evidence quotes.

**Available Features:**
1. **Daily Review**: Summary of a day's entries
2. **Weekly Summary**: Overview of the week
3. **Monthly Summary**: Comprehensive month review
4. **Highlights**: Topics, wins, friction points, action items
5. **Open Loops**: Unresolved items across entries
6. **Question of the Day**: Reflective prompt based on recent entries
7. **Ask Your Journal**: Query your entries with AI-powered search
8. **Pattern Detection**: Identify recurring themes and loops
9. **Monthly Insights**: Data visualization and trend analysis

### 📊 Premium Features (Sprint 5)
**Feature Flags (Local Toggles):**
- Premium Insights
- Advanced Ask Journal
- Unlimited History

**Usage Stats:**
- Days Active
- Entries Written
- AI Calls Used
- First Use / Last Active dates

### ⚙️ Background Tasks (Sprint 5)
- **Async Operations**: Heavy tasks run without blocking UI
- **Progress Tracking**: Real-time progress bars
- **Task Cancellation**: Cancel long-running operations
- **Auto-Cleanup**: Completed tasks auto-remove

## 🗂️ Storage Structure

```
<user-chosen-folder>/
├── entries/
│   └── YYYY/
│       └── MM/
│           └── YYYY-MM-DD.md
├── ai/
│   ├── daily/          # Daily reviews
│   ├── weekly/         # Weekly summaries
│   ├── monthly/        # Monthly summaries
│   ├── highlights/     # Extracted highlights
│   ├── loops/          # Open loops tracker
│   ├── questions/      # Generated questions
│   └── ask/            # Ask your journal responses
├── index.json          # Search index
└── .index/             # Index metadata
```

**Settings Location:**
```
~/Library/Application Support/journal-mvp/settings.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/MindPlus.git
cd MindPlus

# Install dependencies
npm install
```

### Development

```bash
# Run in development mode
npm run dev
```

### Build for Production

```bash
# Build the application
npm run build

# Package for distribution (if configured)
npm run package
```

## 🛠️ Tech Stack

**Core:**
- **Electron**: Desktop application framework
- **React**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server

**Security:**
- **PBKDF2**: Password hashing (100,000 iterations)
- **Crypto**: Native Node.js crypto for encryption

**AI:**
- **OpenAI API**: GPT-4 for insights and summaries
- **Custom Prompts**: Dynamic prompt generation based on preferences

**Storage:**
- **File System**: Native fs/promises for local storage
- **Markdown**: Plain text `.md` files for portability
- **JSON**: Settings and index storage

## 📁 Project Structure

```
src/
├── main/                      # Electron main process
│   ├── index.ts               # Main entry point
│   ├── ipc.ts                 # IPC handlers
│   ├── ai.ts                  # AI integrations
│   ├── taskManager.ts         # Background tasks
│   ├── taskHandlers.ts        # Task IPC handlers
│   └── usage-tracker.ts       # Usage statistics
├── renderer/                  # React application
│   ├── components/            # React components
│   │   ├── Editor.tsx
│   │   ├── Sidebar.tsx
│   │   ├── LockScreen.tsx
│   │   ├── TaskIndicator.tsx
│   │   └── ... (30+ components)
│   ├── hooks/                 # Custom hooks
│   │   └── useTheme.ts
│   ├── utils/                 # Utility functions
│   │   └── debounce.ts
│   ├── styles/                # CSS files
│   ├── types/                 # TypeScript types
│   ├── App.tsx                # Root component
│   └── index.tsx              # Renderer entry
├── shared/                    # Shared types and constants
│   ├── types.ts
│   └── taskTypes.ts
├── services/                  # Business logic
│   ├── indexing/              # Search index
│   ├── insights/              # Data analysis
│   └── security/              # Encryption utilities
└── preload/                   # Preload scripts
    └── index.ts
```

## 🔐 Security

- **Passcode Protection**: PBKDF2 with 100,000 iterations + random salt
- **Sensitive Entries**: Per-entry encryption metadata
- **No External Services**: All data processing happens locally
- **Transparent Storage**: Plain text markdown files for portability

## 📊 Sprint 5 Features

Sprint 5 added enterprise-grade features:

1. **Phase 1**: App Lock & Security Foundation
2. **Phase 2**: Sensitive Entry Protection
3. **Phase 3**: Editor Preferences
4. **Phase 4**: AI Style Preferences
5. **Phase 5**: Feature Flags & Usage Stats
6. **Phase 6**: Background Task System

See [SPRINT5-COMPLETE.md](SPRINT5-COMPLETE.md) for detailed documentation.

## 🎯 Roadmap

### Upcoming Features
- [ ] PDF export for entries
- [ ] Encrypted backup system
- [ ] Mobile-responsive design
- [ ] Premium features implementation
- [ ] Advanced search with filters
- [ ] Tag system for entries
- [ ] Graph view for connections

### Future Considerations
- [ ] Cloud sync (optional, encrypted)
- [ ] Multi-device support
- [ ] Plugin system
- [ ] Custom themes
- [ ] Voice journaling

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review Sprint documentation in project root

## 🙏 Acknowledgments

Built with privacy, security, and user experience as top priorities. Thank you to all contributors and users who provide feedback.

---

**MindPlus** - Your thoughts, your data, your control.
