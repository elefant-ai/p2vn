# P2VN - AI-Driven Visual Novel Framework

A complete framework for creating visual novels where AI drives the narrative through tool calls. Built with React, TypeScript, Zustand, and the Player2 SDK.

## Features

- ✅ **AI-Driven Narrative**: Characters powered by AI that use tools to affect the story
- ✅ **Multi-Language Support**: Full localization with language-specific blueprint folders
- ✅ **Blueprint/Model Architecture**: Clean separation of static data and runtime state
- ✅ **Per-Scene Conversation History**: Fresh context for each scene
- ✅ **Imperative Handle Pattern**: Clean React ↔ GameEngine integration
- ✅ **Zustand State Management**: Global game state (affinity, flags, inventory, dossier)
- ✅ **Tailwind CSS**: Modern, responsive UI styling
- ✅ **TypeScript**: Full type safety throughout

## 🎮 Using This Template

**This is a game-agnostic framework template.** The example game (characters "mc" and "riley", example scenes) is for demonstration only.

### Creating Your Own Game

1. **Keep the framework**: All code in `src/` is generic and reusable
2. **Replace example blueprints**: Delete or modify files in `public/blueprints/*/`
3. **Create your game**:
   - Use `agents/PLANNER.md` to generate new blueprints via AI conversation
   - Or manually create blueprint JSON files following the schema in `PLAN.md`
4. **Add your assets**: Create/generate images for `public/assets/`
5. **Validate**: Use `agents/BUILDER.md` guide to validate your game

### What to Keep vs Replace

**✅ Keep (Framework)**:
- All files in `src/` directory
- `public/locales/` UI translation files (add languages as needed)
- `public/themes/` theme definitions (add custom themes as desired)
- All documentation files (PLAN.md, PROMPT.md, agents/)

**🔄 Replace (Example Game)**:
- `public/blueprints/*/characters/*.json` - Your characters
- `public/blueprints/*/scenes/*.json` - Your scenes
- `public/blueprints/*/chapters.json` - Your chapters
- `public/blueprints/*/routes.json` - Your routes
- `public/blueprints/game.json` - Your game metadata (language-agnostic)
- `public/assets/` - Your game's images/audio
- `package.json` name field - Your game's name

### Quick Template Setup

```bash
# Clone the template
git clone [your-fork] my-visual-novel
cd my-visual-novel

# Install dependencies
npm install

# Rename the project
# Edit package.json: change "name": "p2vn" to "name": "my-game-name"

# Test the example game works
npm run dev

# Clear example content (when ready)
rm -rf public/blueprints/*/characters/*.json
rm -rf public/blueprints/*/scenes/*.json
# ... then create your game blueprints

# Validate your game
npm run validate
```

### AI Agent Workflows

- **PLANNER** (`agents/PLANNER.md`): Conversational blueprint generation
- **BUILDER** (`agents/BUILDER.md`): Scene-by-scene validation and testing
- **THEME_SYSTEM** (`agents/THEME_SYSTEM.md`): Custom theme creation

See `PLAN.md` for complete architecture reference.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Validate code
npm run validate

# Build for production
npm run build
```

## Project Structure

```
src/
├── core/              # Core game systems
│   ├── BlueprintRegistry.ts   # Multi-language blueprint loading
│   ├── GameEngine.ts          # Scene orchestration & AI chat loop
│   ├── PromptGenerator.ts     # System prompt generation
│   └── ToolExecutor.ts        # AI tool execution (6 tools)
├── stores/
│   └── gameStore.ts   # Zustand global state
├── types/
│   ├── blueprints.ts  # Blueprint interfaces
│   ├── models.ts      # Runtime model types
│   └── state.ts       # Game state interface
├── components/        # React UI components
├── hooks/             # Custom React hooks
└── contexts/          # React contexts

public/
├── blueprints/
│   ├── game.json         # Game metadata (language-agnostic)
│   ├── languages.json     # Available languages
│   ├── en_US/            # English blueprints
│   └── ko_KR/            # Korean blueprints
├── assets/               # Shared images/audio
├── themes/               # Theme definitions (language-agnostic)
└── locales/              # UI translation strings
```

## Available Languages

- 🇺🇸 English (en_US)
- 🇰🇷 Korean (ko_KR)

## AI Tools

The AI can call 6 tools to affect the game:

1. `player2_get_state` - Read game state (affinity, flags, vars, inventory)
2. `player2_set_affinity` - Modify character relationship scores
3. `player2_set_flag` - Set story flags
4. `player2_transfer_item` - Transfer items between characters
5. `player2_update_dossier` - Update player objectives/notes
6. `player2_end_scene` - End current scene (terminal operation)

## Creating New Content

### Add a New Language

1. Create `public/blueprints/[lang_code]/` folder
2. Copy all blueprints from `en_US/`
3. Translate all text content
4. Add language to `public/blueprints/languages.json`
5. Create `public/locales/[lang_code].json` for UI strings

### Add a New Scene

1. Create `public/blueprints/[lang]/scenes/[scene_id].json`
2. Define characters, goals, and prompts
3. Add scene ID to chapter's `scenes` array
4. Create corresponding localized versions for all languages

### Add a New Character

1. Create `public/blueprints/[lang]/characters/[char_id].json`
2. Define personality, background, speaking style
3. Add character sprite to `public/assets/characters/`
4. Add character ID to `characters/index.json`

## Architecture Highlights

### Blueprint vs Model Pattern

- **Blueprint**: Static JSON configuration (loaded from disk)
- **Model**: Blueprint + runtime scene context (created by GameEngine)

### Per-Scene History

Conversation history resets on each scene change, ensuring fresh context and preventing context overflow.

### Imperative Handle Pattern

GameEngine communicates with React via resolver functions (not direct state updates), keeping concerns separated.

### Player POV

The main character (MC) sprite is filtered from visible characters - the player sees through the MC's eyes.

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run validate` - Run all checks (typecheck + lint + format)

### Implementation Status

✅ All 8 phases complete:
- Phase 1: TypeScript Types
- Phase 2: Core Systems
- Phase 3: React Components
- Phase 4: Blueprint Files
- Phase 5: UI & Theming
- Phase 6: Assets
- Phase 7: Documentation
- Phase 8: Multi-Language

## Credits

Built following the architecture specified in PLAN.md and PROMPT.md.
