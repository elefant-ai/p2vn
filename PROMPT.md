# AI Visual Novel Framework - Implementation Guide

**Purpose**: Execution instructions for AI agents implementing `PLAN.md`.

---

## Execution Prompt

"You are the Implementation Runner for the AI Visual Novel Framework.

**Phase 0: Setup**

1. Read `PLAN.md` completely to understand the 8-phase architecture

2. Initialize project:
```bash
npm create vite@latest . -- --template react-ts
npm install
npm install zustand @player2-game/sdk
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install -D prettier eslint-config-prettier
npm install -D @testing-library/react @testing-library/jest-dom @vitest/ui jsdom
npm install -D tsx
mkdir -p src/test
mkdir -p public/blueprints/en_US/{characters,scenes,items,themes}
mkdir -p public/blueprints/ko_KR/{characters,scenes,items,themes}
mkdir -p public/assets/{characters,backgrounds,audio}
mkdir -p public/locales
```

3. Configure Tailwind (`tailwind.config.js`):
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        text: 'var(--color-text)',
      },
    },
  },
  plugins: [],
}
```

4. Configure Vitest (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

5. Create test setup (`src/test/setup.ts`):
```typescript
import '@testing-library/jest-dom';
```

6. Add Tailwind to CSS (`src/index.css` top):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

7. Add npm scripts to `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\"",
    "test": "vitest run --passWithNoTests",
    "check": "npm run typecheck && npm run lint && npm run format:check && npm run test",
    "validate": "npm run check && npm run build"
  }
}
```

**Script Descriptions**:
- `check`: Fast validation (typecheck + lint + format check + test) - use during development
- `validate`: Full validation including build - use before commits
- `format`: Auto-fix code formatting
- `format:check`: Verify formatting without changing files

8. Verify setup: `npm run typecheck` (should pass with no source files yet)

**Phase 1-8: Implementation**

Generate task list from PLAN.md phases, write to `TODO.md`, execute top-to-bottom one task at a time.

**Task Format** (in TODO.md):
```
- [ ] T01: Define blueprint types
  - Files: src/types/blueprints.ts
  - Deps: none
  - Notes:
```

**Per Task Workflow**:
1. Restate goal in one sentence
2. List edits (files and changes)
3. Make smallest change that satisfies goal
4. Validate: `npm run check` (fast: typecheck + lint + format check + test)
5. If validation fails: apply minimal fix, retry (max 3 attempts)
6. If blocked after 3 attempts: mark `[!]`, document error, create Debug-Txx task, consider `git reset --hard HEAD~1`
7. Record completion in TODO.md with one-line note
8. Commit: `git add -A && git commit -m 'Txx: <goal> (passes check)'`

**Critical Patterns** (see PLAN.md for full details):
- **Blueprint/Model** (lines 9-14, 187-199): Blueprint = static JSON, Model = Blueprint + runtime context
- **Imperative Handles** (lines 752-771, 1052-1078): GameEngine ↔ React via resolver functions, NOT state
- **Per-Scene History** (lines 222, 748-909): Reset conversation history on each scene change
- **Multi-Language** (lines 16-21, 229-370): Blueprints in `blueprints/{lang}/`, assets shared, UI in `locales/{lang}.json`
- **Zustand**: Global game state (affinity, flags, inventory)
- **Context**: BlueprintRegistry via React Context
- **Player POV**: Filter MC sprite from visible characters

**Phase Order** (complete each fully before next):
1. **Types** (lines 25-223): blueprints.ts, models.ts, state.ts
2. **Core** (lines 227-980): BlueprintRegistry → GameStore → ToolExecutor → PromptGenerator → GameEngine
3. **Components** (lines 984-1782): Hooks → Context → UI → Integration
4. **Blueprints** (lines 1786-2003): Minimal example (1 scene, 2 chars, 2 langs)
5. **UI/Theming** (lines 2007-2047): Tailwind + ThemeProvider
6. **Assets** (lines 2049-2069): Placeholder images
7. **Template** (lines 2071-2277): Documentation
8. **Multi-Lang** (lines 2172-2232): Validation scripts

**Blueprint Validation** (reference - create these scripts during Phase 4):

JSON syntax check (run when blueprints exist):
```bash
find public/blueprints public/locales -name "*.json" | while read file; do
  node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" || echo "❌ $file"
done
```

Language parity (create `scripts/validate-languages.ts` in Phase 4):
```typescript
import fs from 'fs';
import path from 'path';

function getFilesRecursive(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? getFilesRecursive(fullPath) : fullPath;
  });
}

const blueprintsDir = 'public/blueprints';
const languages = JSON.parse(fs.readFileSync(`${blueprintsDir}/languages.json`, 'utf8'));
const [base, ...others] = languages;
const baseFiles = getFilesRecursive(`${blueprintsDir}/${base}`);

let errors = 0;
others.forEach(lang => {
  const langFiles = getFilesRecursive(`${blueprintsDir}/${lang}`);
  const baseRelative = baseFiles.map(f => path.relative(`${blueprintsDir}/${base}`, f));
  const langRelative = langFiles.map(f => path.relative(`${blueprintsDir}/${lang}`, f));
  
  const missing = baseRelative.filter(f => !langRelative.includes(f));
  const extra = langRelative.filter(f => !baseRelative.includes(f));
  
  if (missing.length) { console.error(`❌ ${lang} missing:`, missing); errors++; }
  if (extra.length) { console.error(`❌ ${lang} extra:`, extra); errors++; }
});

if (errors) process.exit(1);
console.log('✅ All languages have matching structure');
```

Run: `npx tsx scripts/validate-languages.ts`

Asset reference check (run when assets are referenced):
```bash
grep -r '"uri"' public/blueprints/ | grep -o '"/assets/[^"]*"' | sort -u | while read uri; do
  file=$(echo $uri | tr -d '"')
  [ ! -f "public$file" ] && echo "❌ Missing: public$file"
done
```

**Recovery** (after 3 failed attempts):
1. Mark task `[!]` in TODO.md with full error
2. Create Debug-Txx task above next task
3. Consider rollback: `git reset --hard HEAD~1`
4. Break task into 2-3 smaller sub-tasks
5. Never disable TypeScript rules, skip tests, or comment out code

**Git Workflow**:
- Commit after each task: `git add -A && git commit -m 'Txx: <goal> (passes check)'`
- Run full validation before PR: `npm run validate` (includes build)
- Optional pre-commit hook (.git/hooks/pre-commit):
  ```bash
  #!/usr/bin/env bash
  npm run check || exit 1
  ```
  Then: `chmod +x .git/hooks/pre-commit`

**Execution Flow**: Setup → Generate TODO → Execute top task → Validate → Commit → Repeat

**Principles**: Small changes, full validation every task, PLAN.md is source of truth, follow patterns strictly, recover intelligently.

**Success**: All 8 phases complete, all tasks `[x]`, end-to-end validation passes.

Keep changes small, code readable, names consistent with PLAN.md."
