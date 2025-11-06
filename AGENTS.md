# P2VN Codebase Guide for AI Agents

## Environment Variables

- `VITE_PLAYER2_ENDPOINT` - Player2 API endpoint (default: `https://api.player2.game/v1`)
- `VITE_PLAYER2_API_KEY` - API key (optional, can also use localStorage)

API key priority: localStorage → environment variable

## Core Architecture Patterns

### Blueprint/Model Pattern
- **Blueprint** = Static JSON config (loaded from `public/blueprints/`)
- **Model** = Blueprint + runtime scene context (created by GameEngine)
- Never modify blueprints at runtime; create models instead

### State Management
- **Zustand** (`src/stores/gameStore.ts`) - Global state: affinity, flags, inventory, dossier
- **Per-scene conversation history** - Reset on each scene change (in GameEngine)
- **React Context** (`src/contexts/RegistryContext.tsx`) - BlueprintRegistry singleton

### GameEngine ↔ React Communication
- **Imperative Handle Pattern** - Uses callback resolvers, NOT state updates
- `playerInputCallback` - Wait for player input
- `continueCallback` - Wait for continue click
- React components set handlers via `setPlayerInputHandler()`, `setContinueHandler()`

## Key Directories

```
src/core/          # Game engine (GameEngine, BlueprintRegistry, PromptGenerator, ToolExecutor)
src/stores/        # Zustand state (gameStore.ts)
src/components/    # React UI (SceneView is the main integration point)
src/types/         # TypeScript interfaces (blueprints, models, state)
public/blueprints/ # Game content organized by language (en_US/, ko_KR/)
public/assets/     # Images/audio (shared across languages)
```

## Extension Points

### Adding New AI Tools
1. Add function definition to `ToolExecutor.getToolDefinitions()`
2. Add case to `ToolExecutor.execute()`
3. Update `PromptGenerator` to document the new tool

### Adding New Languages
1. Create `public/blueprints/{lang_code}/` folder
2. Copy all blueprints from base language
3. Translate text content
4. Add to `public/blueprints/languages.json`
5. Create `public/locales/{lang_code}.json` for UI strings

### Adding New Scenes
1. Create JSON in `public/blueprints/{lang}/scenes/{scene_id}.json`
2. Define: characters, goals, prompt, intro/outro
3. Add scene_id to chapter's `scenes` array
4. Repeat for all languages

### Adding Custom Themes
1. Create theme blueprint in `public/themes/{theme_id}.json`
2. Create theme CSS in `src/themes/{theme-name}.css`
3. Update `game.json` theme field
4. Import theme CSS in `src/main.tsx`

## Critical Implementation Details

- **MC sprite is filtered** - Player POV; don't render player character sprite
- **Conversation history is per-scene** - Reset on `startScene()`, NOT global
- **BlueprintRegistry is singleton** - Provided via React Context, loaded once on mount
- **Language switching** - Reloads all blueprints, requires page reload
- **Asset paths** - Resolved at blueprint load time (supports absolute/relative URIs)

## Testing/Development

- `npm run dev` - Start dev server
- `npm run typecheck` - Type checking only (fast)
- `npm run validate` - Full validation (typecheck + lint + test + build)
- Blueprints are hot-reloaded by Vite (changes reflect immediately)

## Common Mistakes to Avoid

1. Don't modify blueprint objects directly - they're shared across scenes
2. Don't store conversation history in Zustand - it's per-scene in GameEngine
3. Don't hardcode Player2 API calls in components - use GameEngine orchestration
4. Don't forget to add scene transitions via goals' `on_complete.transition_to`
5. Don't skip language parity - all languages need same blueprint structure
