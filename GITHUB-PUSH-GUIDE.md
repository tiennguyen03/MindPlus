# GitHub Push Guide - MindPlus

Step-by-step instructions to push your MindPlus project to GitHub.

---

## Prerequisites

1. **GitHub Account**: Make sure you have a GitHub account at [github.com](https://github.com)
2. **Git Installed**: Check if Git is installed:
   ```bash
   git --version
   ```
   If not installed, download from [git-scm.com](https://git-scm.com)

3. **GitHub CLI (Optional but Recommended)**:
   ```bash
   brew install gh
   gh auth login
   ```

---

## Step 1: Initialize Git Repository (if not already done)

```bash
# Navigate to your project directory
cd /Users/tiennguyen03/Desktop/MindPlus

# Check if Git is already initialized
git status
```

If you see "fatal: not a git repository", initialize Git:

```bash
git init
```

---

## Step 2: Create .gitignore File

Create a `.gitignore` file to exclude unnecessary files:

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build outputs
dist/
dist-electron/
out/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# User data (important!)
*.journal/
journal-data/
test-journal/

# Application Support (contains user settings)
# Note: We don't commit user's personal settings.json
**/Application Support/journal-mvp/

# Temporary files
*.tmp
.cache/

# TypeScript
*.tsbuildinfo

# Coverage
coverage/
.nyc_output/

# Electron
electron-builder.yml
EOF
```

---

## Step 3: Stage Your Files

```bash
# Add all files to staging
git add .

# Check what will be committed
git status
```

You should see all your project files in green (staged for commit).

---

## Step 4: Create Initial Commit

```bash
git commit -m "Initial commit: Journal MVP

- Offline-first desktop journaling app
- Sprint 5 complete: Security, Personalization, Premium Features
- All 6 phases implemented successfully
- 19 new components, ~3,000 lines of code
- 0 TypeScript errors

Features:
- App lock with PBKDF2 encryption
- Sensitive entry protection
- Editor customization (fonts, sizes, themes)
- AI style preferences
- Feature flags & usage stats
- Background task system

Built with Electron, React, TypeScript"
```

---

## Step 5: Create GitHub Repository

### Option A: Using GitHub CLI (Recommended)

```bash
# Create a new public repository
gh repo create MindPlus --public --source=. --description="Offline-first, privacy-focused desktop journal with AI-powered insights" --push

# Or create a private repository
gh repo create MindPlus --private --source=. --description="Offline-first, privacy-focused desktop journal with AI-powered insights" --push
```

### Option B: Using GitHub Website

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `MindPlus`
3. Description: `Offline-first, privacy-focused desktop journal with AI-powered insights`
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

Then connect your local repo:

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/MindPlus.git

# Verify remote was added
git remote -v
```

---

## Step 6: Push to GitHub

```bash
# Push to main branch
git push -u origin main

# If you get an error about 'master' vs 'main', rename your branch:
git branch -M main
git push -u origin main
```

---

## Step 7: Verify Upload

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/MindPlus`
2. You should see:
   - All source files
   - Updated README.md
   - Sprint documentation files
   - .gitignore file
   - No node_modules or build files

---

## Step 8: Add Topics/Tags (Optional)

On your GitHub repository page:
1. Click "About" gear icon (top right)
2. Add topics: `electron`, `react`, `typescript`, `journaling`, `privacy`, `offline-first`, `ai`, `desktop-app`
3. Add website URL (if you have one)
4. Click "Save changes"

---

## Step 9: Create Releases (Optional)

Create a release for Sprint 5:

```bash
# Using GitHub CLI
gh release create v1.0.0-sprint5 --title "Sprint 5: Privacy, Personalization & Premium Features" --notes "
Sprint 5 Complete ✅

All 6 phases implemented:
- Phase 1: App Lock & Security Foundation
- Phase 2: Sensitive Entry Protection
- Phase 3: Editor Preferences
- Phase 4: AI Style Preferences
- Phase 5: Feature Flags & Usage Stats
- Phase 6: Background Task System

See SPRINT5-COMPLETE.md for full details.
"
```

Or create a release manually on GitHub:
1. Go to your repo → Releases → Create new release
2. Tag: `v1.0.0-sprint5`
3. Title: "Sprint 5: Privacy, Personalization & Premium Features"
4. Copy description from above
5. Publish release

---

## Step 10: Set Up Branch Protection (Optional)

For collaborative work:

1. Go to repo → Settings → Branches
2. Add branch protection rule for `main`
3. Enable:
   - Require pull request reviews
   - Require status checks to pass
   - Require linear history

---

## Future Commits

When making changes:

```bash
# 1. Check status
git status

# 2. Stage changes
git add .
# Or stage specific files
git add src/renderer/components/NewComponent.tsx

# 3. Commit with descriptive message
git commit -m "feat: add new component for X

- Description of changes
- Why it was needed
- Any breaking changes"

# 4. Push to GitHub
git push
```

---

## Commit Message Format

Use conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build/tool changes

**Examples:**
```bash
git commit -m "feat(editor): add distraction-free mode"
git commit -m "fix(security): resolve passcode validation bug"
git commit -m "docs: update README with Sprint 5 features"
```

---

## Troubleshooting

### Large Files Error

If you get "file too large" error:

```bash
# Check file sizes
find . -size +50M

# Use Git LFS for large files
git lfs install
git lfs track "*.app"
git lfs track "*.dmg"
```

### Authentication Error

If push fails with authentication error:

```bash
# Use GitHub CLI
gh auth login

# Or use personal access token
# Go to GitHub → Settings → Developer settings → Personal access tokens
# Create token with 'repo' scope
# Use token as password when pushing
```

### Accidentally Committed Secrets

If you committed API keys or secrets:

```bash
# Remove from last commit
git reset --soft HEAD~1
# Remove sensitive file
git rm --cached path/to/sensitive/file
# Add to .gitignore
echo "path/to/sensitive/file" >> .gitignore
# Commit again
git add .
git commit -m "fix: remove sensitive data"
```

**Important:** If already pushed, the secrets are in history. You'll need to:
1. Revoke the exposed API keys immediately
2. Use `git filter-branch` or BFG Repo-Cleaner to remove from history
3. Force push (dangerous, coordinate with team)

---

## GitHub Repository Settings

### Recommended Settings

1. **General:**
   - Features: Enable Issues, disable Wikis (use README)
   - Pull Requests: Allow merge commits

2. **Security:**
   - Enable Dependabot alerts
   - Enable secret scanning

3. **Actions:**
   - Set up CI/CD (optional) for automated testing

---

## Next Steps After Push

1. **Add GitHub Actions** for CI/CD:
   - Create `.github/workflows/test.yml`
   - Run tests on every push
   - Build and release automatically

2. **Set up Project Board:**
   - Create project for Sprint 6
   - Add issues for upcoming features
   - Track progress visually

3. **Write CONTRIBUTING.md:**
   - Code style guidelines
   - Pull request process
   - Development setup

4. **Add LICENSE:**
   - Choose appropriate license (MIT recommended)
   - Add LICENSE file to repo

---

## Summary Commands

```bash
# Quick push workflow
cd /Users/tiennguyen03/Desktop/MindPlus
git add .
git commit -m "Your commit message"
git push

# Check status anytime
git status

# View commit history
git log --oneline

# See what changed
git diff
```

---

**You're all set!** 🚀

Your MindPlus project is now on GitHub and ready for collaboration, version control, and deployment.
