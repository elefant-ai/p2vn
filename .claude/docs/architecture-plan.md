# AI-Driven Visual Novel Framework - Complete Plan

## Overview

Build a **GitHub template** for creating visual novels where AI drives the narrative through tool calls. Uses **React + TypeScript + Zustand** for UI/state, **Player2 SDK** for chat completions, **per-language blueprint folders** for multi-language support, and a **Blueprint/Model** architecture for game content.

**Theming System**: Uses **universal pluggable themes** where component code never changes. All components use `.vn-*` classes. See **Phase 5 (Section 5.3)** for complete implementation guide.

## Core Architecture

### Blueprint vs Model Pattern

- **Blueprint**: JSON configuration files (static data)
- **Model**: Runtime entity created by GameEngine (blueprint + scene context)

Example: `CharacterBlueprint` defines sprite, voice, inventory. In Scene A, the character gets goal "convince player". GameEngine creates `CharacterModel` merging blueprint + scene-specific config.

### Multi-Language Strategy

- Each language has complete blueprint tree: `blueprints/en_US/`, `blueprints/ko_KR/`
- Assets are shared: `assets/` (images, audio)
- Framework UI strings: `locales/en_US.json`
- AI automatically responds in selected language via prompt instruction

### Universal Theme System

- **Universal Classes**: All components use `.vn-*` classes for consistent theming
  - Core UI: `.vn-button`, `.vn-heading`, `.vn-text`, `.vn-box`, `.vn-input`, `.vn-screen`
  - Menu/Navigation: `.vn-menu`, `.vn-menu-item`, `.vn-hamburger-line`, `.vn-divider`, `.vn-overlay`
- **Pluggable Themes**: Themes are CSS files that style those classes differently
- **No Code Changes**: Switching themes only requires changing one import line in `main.tsx`
- **Complete Separation**: Theme styling is 100% separate from component logic
- See `agents/THEME_SYSTEM.md` for comprehensive guide

---

## Phase 1: TypeScript Types & Interfaces

### 1.1 Blueprint Types

```typescript
// src/types/blueprints.ts

export interface ImageBlueprint {
  prompt?: string; // For generation
  uri?: string; // Inline data or URL
}

export interface AudioBlueprint {
  prompt?: string;
  uri?: string;
}

export interface VoiceBlueprint {
  prompt?: string;
  gender?: string;
  language?: string;
  voice_id?: string;
}

export interface ItemBlueprint {
  id: string;
  name: string;
  description: string;
  image: ImageBlueprint;
}

export interface CharacterBlueprint {
  id: string;
  name: string;
  role: string;
  introduction?: string; // First-person conversational intro (shown once when character first appears)

  view: {
    default: ImageBlueprint;
    [state: string]: ImageBlueprint; // sad, happy, angry, etc.
  };

  identity: {
    personality: string;
    background: string;
    speaking_style: string;
    relationships?: Record<string, string>;
  };

  voice: VoiceBlueprint;
  inventory: ItemBlueprint[];
}

export interface GoalBlueprint {
  id: string;
  character_id?: string; // null = global goal
  description: string; // Description for AI (AI decides when met)

  on_complete: {
    transition_to?: string; // Scene ID with suffix: "scene_1_success"
    give_items?: string[]; // Item IDs
    unlock_route?: string;
  };
}

export interface SceneBlueprint {
  id: string;
  title: string;

  view: {
    default: ImageBlueprint;
    [state: string]: ImageBlueprint;
  };

  audio?: AudioBlueprint;

  prompt: string; // Base system prompt text

  characters: string[]; // Character IDs

  goals: GoalBlueprint[];

  intro?: string; // Typewriter text on entry
  outro?: string; // Typewriter text on exit
}

export interface ChapterBlueprint {
  id: string;
  title: string;
  intro: string; // Chapter introduction text
  scenes: string[]; // Scene IDs
}

export interface RouteBlueprint {
  id: string;
  title: string;
  description: string;
  chapters: string[]; // Chapter IDs
  starting_chapter: string;

  requirements?: {
    unlocked_routes?: string[];
    flags?: Record<string, boolean>;
    affinity?: Record<string, number>;
  };
}

export interface ThemeBlueprint {
  id: string;
  name: string;

  colors: {
    primary: string; // Main brand color, headings, primary buttons
    secondary: string; // Highlights, secondary elements
    background: string; // Main background color
    text: string; // Main text color
    accent: string; // Special emphasis, warnings
    border: string; // Borders around boxes/inputs
    shadow: string; // Shadows, glows, depth effects
    success: string; // Positive feedback
    error: string; // Negative feedback, errors
    character_player: string; // Player character dialogue color
    character_npc: string; // NPC character dialogue color
  };

  fonts: {
    heading: string; // Font for headings/titles (with fallbacks)
    body: string; // Font for body text (with fallbacks)
    dialogue: string; // Font for dialogue (with fallbacks)
  };

  transitions: {
    scene_fade_duration: number; // Milliseconds
    text_speed: number; // Milliseconds per character
  };

  ui?: {
    border_width?: string;
    border_style?: string;
    box_shadow?: string;
    button_transform?: string;
    button_shadow_hover?: string;
    [key: string]: string | undefined;
  };
}

export interface GameBlueprint {
  id: string;
  title: string;
  version: string;
  description: string;
  authors: string[];

  player_character_id: string; // MC character ID
  routes: string[];
  starting_route: string;

  main_menu_image?: ImageBlueprint; // Main menu background

  initial_state?: {
    flags?: Record<string, boolean>;
    vars?: Record<string, unknown>;
    unlocked_routes?: string[];
  };

  theme: string; // Theme ID

  settings?: {
    auto_save?: boolean;
    text_speed?: number;
    voice_enabled?: boolean;
    music_volume?: number;
    sfx_volume?: number;
  };
}

// Note: `language` field removed - game.json is now language-agnostic.
// Current language is managed by BlueprintRegistry via user selection.
```

### 1.2 Model Types

```typescript
// src/types/models.ts

export interface CharacterModel {
  blueprint: CharacterBlueprint;
  sceneGoals: GoalBlueprint[]; // Goals from current scene
}

export interface SceneModel {
  blueprint: SceneBlueprint;
  characters: Map<string, CharacterModel>;
  activeCharacter: string; // Currently speaking
}
```

### 1.3 Game State Type

```typescript
// src/types/state.ts

export interface GameState {
  affinity: Record<string, number>;
  flags: Record<string, boolean>;
  vars: Record<string, unknown>;
  inventory: ItemBlueprint[];
  dossier: {
    objectives: string[];
    notes: string[];
  };
  current_route: string;
  current_chapter: string;
  current_scene: string;
  unlocked_routes: string[];
}
```

**Note**: Conversation history is NOT in global state - it's per-scene in GameEngine.

---

## Phase 2: Core Systems

### 2.1 BlueprintRegistry (Multi-Language)

```typescript
// src/core/BlueprintRegistry.ts

export class BlueprintRegistry {
  private characters = new Map<string, CharacterBlueprint>();
  private scenes = new Map<string, SceneBlueprint>();
  private chapters = new Map<string, ChapterBlueprint>();
  private routes = new Map<string, RouteBlueprint>();
  private items = new Map<string, ItemBlueprint>();
  private themes = new Map<string, ThemeBlueprint>();
  private game: GameBlueprint | null = null;
  private currentLanguage: string = 'en_US';
  private availableLanguages: string[] = [];

  async load(language?: string): Promise<void> {
    // 1. Load available languages
    const languagesResponse = await fetch(`${import.meta.env.BASE_URL}blueprints/languages.json`);
    this.availableLanguages = await languagesResponse.json();

    // 2. Auto-detect or use provided language
    const targetLanguage = language || this.detectLanguage();
    this.currentLanguage = targetLanguage;

    // 3. Load game.json (language-agnostic)
    this.game = await fetch(`${import.meta.env.BASE_URL}blueprints/game.json`).then((r) =>
      r.json()
    );

    // 4. Load all blueprints from language-specific folder
    const basePath = `${import.meta.env.BASE_URL}blueprints/${targetLanguage}`;

    // Load characters
    const charIds = await fetch(`${basePath}/characters/index.json`).then((r) => r.json());
    for (const id of charIds) {
      const char = await fetch(`${basePath}/characters/${id}.json`).then((r) => r.json());
      this.characters.set(id, char);
    }

    // Load scenes
    const sceneIds = await fetch(`${basePath}/scenes/index.json`).then((r) => r.json());
    for (const id of sceneIds) {
      const scene = await fetch(`${basePath}/scenes/${id}.json`).then((r) => r.json());
      this.scenes.set(id, scene);
    }

    // Load chapters
    const chapters = await fetch(`${basePath}/chapters.json`).then((r) => r.json());
    chapters.forEach((ch) => this.chapters.set(ch.id, ch));

    // Load routes
    const routes = await fetch(`${basePath}/routes.json`).then((r) => r.json());
    routes.forEach((rt) => this.routes.set(rt.id, rt));

    // Load items
    const itemIds = await fetch(`${basePath}/items/index.json`).then((r) => r.json());
    for (const id of itemIds) {
      const item = await fetch(`${basePath}/items/${id}.json`).then((r) => r.json());
      this.items.set(id, item);
    }

    // Load theme (themes are language-agnostic)
    const theme = await fetch(`${import.meta.env.BASE_URL}themes/${this.game.theme}.json`).then(
      (r) => r.json()
    );
    this.themes.set(theme.id, theme);
  }

  private detectLanguage(): string {
    // 1. Check localStorage for user preference
    const saved = localStorage.getItem('game_language');
    if (saved && this.availableLanguages.includes(saved)) return saved;

    // 2. Check browser language
    const browserLang = navigator.language.replace('-', '_'); // "en-US" → "en_US"
    if (this.availableLanguages.includes(browserLang)) return browserLang;

    // 3. Fallback to first available language (usually en_US)
    return this.availableLanguages[0] || 'en_US';
  }

  async switchLanguage(language: string): Promise<void> {
    if (!this.availableLanguages.includes(language)) {
      throw new Error(`Language ${language} not available`);
    }

    // Clear current data
    this.characters.clear();
    this.scenes.clear();
    this.chapters.clear();
    this.routes.clear();
    this.items.clear();
    this.themes.clear();

    // Reload with new language
    await this.load(language);

    // Save preference
    localStorage.setItem('game_language', language);
  }

  getCharacter(id: string): CharacterBlueprint {
    const char = this.characters.get(id);
    if (!char) throw new Error(`Character ${id} not found`);
    return char;
  }

  getScene(id: string): SceneBlueprint {
    const scene = this.scenes.get(id);
    if (!scene) throw new Error(`Scene ${id} not found`);
    return scene;
  }

  getChapter(id: string): ChapterBlueprint {
    const chapter = this.chapters.get(id);
    if (!chapter) throw new Error(`Chapter ${id} not found`);
    return chapter;
  }

  getRoute(id: string): RouteBlueprint {
    const route = this.routes.get(id);
    if (!route) throw new Error(`Route ${id} not found`);
    return route;
  }

  getItem(id: string): ItemBlueprint {
    const item = this.items.get(id);
    if (!item) throw new Error(`Item ${id} not found`);
    return item;
  }

  getTheme(id: string): ThemeBlueprint {
    const theme = this.themes.get(id);
    if (!theme) throw new Error(`Theme ${id} not found`);
    return theme;
  }

  getGame(): GameBlueprint {
    if (!this.game) throw new Error('Game not loaded');
    return this.game;
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }
  getAvailableLanguages(): string[] {
    return this.availableLanguages;
  }
}
```

**Provide via React Context:**

```typescript
// src/contexts/RegistryContext.tsx
export const RegistryContext = createContext<BlueprintRegistry | null>(null);
export const useRegistry = () => useContext(RegistryContext)!;
```

### 2.2 GameState (Zustand)

```typescript
// src/stores/gameStore.ts

export const useGameStore = create<
  GameState & {
    setAffinity: (charId: string, delta: number) => void;
    setFlag: (flagId: string, value: boolean) => void;
    setVar: (key: string, value: unknown) => void;
    addItem: (item: ItemBlueprint) => void;
    removeItem: (itemId: string) => void;
    transferItem: (fromId: string, toId: string, itemId: string) => void;
    updateDossier: (type: 'objective' | 'note', text: string) => void;
    setCurrentScene: (route: string, chapter: string, scene: string) => void;
    unlockRoute: (routeId: string) => void;
    reset: () => void;
    save: () => void;
    load: () => void;
  }
>((set, get) => ({
  // Initial state
  affinity: {},
  flags: {},
  vars: {},
  inventory: [],
  dossier: { objectives: [], notes: [] },
  current_route: '',
  current_chapter: '',
  current_scene: '',
  unlocked_routes: [],

  // Methods
  setAffinity: (charId, delta) =>
    set((state) => ({
      affinity: { ...state.affinity, [charId]: (state.affinity[charId] || 0) + delta },
    })),

  setFlag: (flagId, value) =>
    set((state) => ({
      flags: { ...state.flags, [flagId]: value },
    })),

  setVar: (key, value) =>
    set((state) => ({
      vars: { ...state.vars, [key]: value },
    })),

  addItem: (item) =>
    set((state) => ({
      inventory: [...state.inventory, item],
    })),

  removeItem: (itemId) =>
    set((state) => ({
      inventory: state.inventory.filter((i) => i.id !== itemId),
    })),

  transferItem: (fromId, toId, itemId) => {
    // Simple v1 implementation: only supports giving items to player
    // fromId and toId are character IDs, but we only track player inventory
    // For NPC-to-player transfers, just add item by ID lookup
    set((state) => {
      // Check if item already in inventory
      if (state.inventory.some((i) => i.id === itemId)) {
        return state; // Already have it
      }
      // Note: Actual item lookup requires BlueprintRegistry
      // For now, we'll handle this in ToolExecutor which has registry access
      return state;
    });
  },

  updateDossier: (type, text) =>
    set((state) => ({
      dossier: {
        ...state.dossier,
        [type === 'objective' ? 'objectives' : 'notes']: [
          ...state.dossier[type === 'objective' ? 'objectives' : 'notes'],
          text,
        ],
      },
    })),

  setCurrentScene: (route, chapter, scene) =>
    set({
      current_route: route,
      current_chapter: chapter,
      current_scene: scene,
    }),

  unlockRoute: (routeId) =>
    set((state) => ({
      unlocked_routes: state.unlocked_routes.includes(routeId)
        ? state.unlocked_routes
        : [...state.unlocked_routes, routeId],
    })),

  reset: () =>
    set({
      affinity: {},
      flags: {},
      vars: {},
      inventory: [],
      dossier: { objectives: [], notes: [] },
      current_route: '',
      current_chapter: '',
      current_scene: '',
      unlocked_routes: [],
    }),

  save: () => {
    const state = get();
    localStorage.setItem('vn_save', JSON.stringify(state));
  },

  load: () => {
    const saved = localStorage.getItem('vn_save');
    if (saved) {
      const state = JSON.parse(saved);
      set(state);
    }
  },
}));
```

**Automatic Save Triggers**: The game automatically saves progress at key moments:

- When player selects a route (before character intro)
- When entering a scene (after authentication check)
- When transitioning between scenes (before loading next scene)

**Continue Functionality**: The main menu shows a "Continue" button if save data exists. Clicking it:

1. Loads the saved state via `gameStore.load()`
2. Checks if `current_scene` is set
3. If yes: resumes directly at that scene
4. If no: starts from route selection

**State Persistence**: All game state (affinity, flags, vars, inventory, dossier, current location, unlocked routes, introduced characters) is saved to localStorage under the key `'vn_save'`.

### 2.3 ToolExecutor

```typescript
// src/core/ToolExecutor.ts

export class ToolExecutor {
  constructor(
    private registry: BlueprintRegistry,
    private gameStore: typeof useGameStore
  ) {}

  private getState(keys: string[]): Record<string, unknown> {
    const state = this.gameStore.getState();
    return keys.reduce(
      (acc, key) => {
        // Handle dotted paths like "affinity.npc_1"
        const parts = key.split('.');
        let value: any = state;
        for (const part of parts) {
          value = value?.[part];
          if (value === undefined) break;
        }
        acc[key] = value;
        return acc;
      },
      {} as Record<string, unknown>
    );
  }

  execute(toolName: string, args: Record<string, unknown>): any {
    try {
      switch (toolName) {
        case 'player2_get_state':
          return this.getState(args.keys as string[]);

        case 'player2_set_affinity':
          this.gameStore.getState().setAffinity(args.character_id as string, args.delta as number);
          return { success: true };

        case 'player2_set_flag':
          this.gameStore.getState().setFlag(args.flag_id as string, args.value as boolean);
          return { success: true };

        case 'player2_transfer_item':
          // Lookup item from registry and add to player inventory
          const item = this.registry.getItem(args.item_id as string);
          const receiverId = args.receiver_id as string;
          const game = this.registry.getGame();

          // Only support giving items to player for v1
          if (receiverId === game.player_character_id) {
            this.gameStore.getState().addItem(item);
            return { success: true, item_transferred: item.name };
          }

          return { success: false, error: 'Only transfers to player are supported' };

        case 'player2_update_dossier':
          this.gameStore
            .getState()
            .updateDossier(args.type as 'objective' | 'note', args.text as string);
          return { success: true };

        case 'player2_end_scene':
          return { terminal: true, result: args.result, summary: args.summary };

        default:
          return { success: false, error: 'Unknown tool' };
      }
    } catch (error) {
      // Graceful error handling - log and return error without breaking gameplay
      console.error(`Error executing tool ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  getToolDefinitions(): any[] {
    return [
      {
        type: 'function',
        function: {
          name: 'player2_get_state',
          description: 'Read game state (affinity, flags, vars, inventory)',
          parameters: {
            type: 'object',
            properties: { keys: { type: 'array', items: { type: 'string' } } },
            required: ['keys'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'player2_set_affinity',
          description: 'Modify character relationship score',
          parameters: {
            type: 'object',
            properties: {
              character_id: { type: 'string' },
              delta: { type: 'number' },
            },
            required: ['character_id', 'delta'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'player2_set_flag',
          description: 'Set story flag',
          parameters: {
            type: 'object',
            properties: {
              flag_id: { type: 'string' },
              value: { type: 'boolean' },
            },
            required: ['flag_id', 'value'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'player2_transfer_item',
          description: 'Transfer item between characters',
          parameters: {
            type: 'object',
            properties: {
              sender_id: { type: 'string' },
              receiver_id: { type: 'string' },
              item_id: { type: 'string' },
            },
            required: ['sender_id', 'receiver_id', 'item_id'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'player2_update_dossier',
          description: 'Update player dossier with objectives or notes',
          parameters: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['objective', 'note'] },
              text: { type: 'string' },
            },
            required: ['type', 'text'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'player2_end_scene',
          description: 'End the current scene (TERMINAL)',
          parameters: {
            type: 'object',
            properties: {
              result: { type: 'string', enum: ['success', 'neutral', 'fail'] },
              summary: { type: 'string' },
            },
            required: ['result'],
          },
        },
      },
    ];
  }
}
```

### 2.4 PromptGenerator (with Language Support)

```typescript
// src/core/PromptGenerator.ts

export class PromptGenerator {
  constructor(private registry: BlueprintRegistry) {}

  generateSystemPrompt(sceneId: string, characterId: string): string {
    const scene = this.registry.getScene(sceneId);
    const character = this.registry.getCharacter(characterId);
    const characterGoals = scene.goals.filter(g => g.character_id === characterId);

    // Language instruction based on current language from registry
    const currentLanguage = this.registry.getCurrentLanguage();
    const languageInstruction = this.getLanguageInstruction(currentLanguage);

    const template = scene.prompt;

    return `
**SCENE**: ${scene.title}
**YOUR ROLE**: You are ${character.name}. ${character.identity.personality}
${languageInstruction}

**SCENE CONTEXT**:
${template}

**YOUR GOALS IN THIS SCENE**:
${characterGoals.map(g => `- ${g.description}`).join('\n')}

**CHARACTER BACKGROUND**:
${character.identity.background}

**SPEAKING STYLE**:
${character.identity.speaking_style}

**TOOLS AVAILABLE**:
- player2_get_state: Read affinity, flags, vars
- player2_set_affinity: Adjust relationship
- player2_set_flag: Mark story moments
- player2_transfer_item: Give/take items
- player2_update_dossier: Update player objectives
- player2_end_scene: End scene when goal achieved

**INSTRUCTIONS**:
1. On first turn, call player2_get_state to check context
2. Respond naturally (1-3 sentences)
3. Use tools when player makes meaningful choices
4. Call player2_end_scene when your goals are achieved

Respond naturally as ${character.name}. Never break character.
    `.trim();
  }

  private getLanguageInstruction(languageCode: string): string {
    const languageNames: Record<string, string> = {
      'en_US': 'English',
      'ko_KR': 'Korean',
      'fr_FR': 'French',
      'de_DE': 'German',
      'it_IT': 'Italian',
      'pt_BR': 'Portuguese',
      'ru_RU': 'Russian',
      'ja_JP': 'Japanese',
      'ko_KR': 'Korean',
      'zh_CN': 'Chinese (Simplified)',
      'zh_TW': 'Chinese (Traditional)',
      'ar_SA': 'Arabic',
      'hi_IN': 'Hindi'
    };

    const languageName = languageNames[languageCode] || 'English';

    if (languageCode === 'en_US') {
      return '';  // No special instruction for English
    }

    return `\n**CRITICAL LANGUAGE REQUIREMENT**: You MUST respond ONLY in ${languageName}. Every word of your dialogue, thoughts, and responses must be in ${languageName}. This is MANDATORY.`;
  }
}
}
```

### 2.5 GameEngine (Per-Scene Conversation History)

```typescript
// src/core/GameEngine.ts

export class GameEngine {
  private sceneModel: SceneModel | null = null;
  private promptGenerator: PromptGenerator;
  private toolExecutor: ToolExecutor;
  private conversationHistory: any[] = []; // Per-scene history

  // Handler callbacks for React communication
  private playerInputCallback: ((resolve: (text: string) => void) => void) | null = null;
  private continueCallback: ((resolve: () => void) => void) | null = null;

  constructor(
    private registry: BlueprintRegistry,
    private gameStore: typeof useGameStore,
    private onUpdate: (update: SceneUpdate) => void
  ) {
    this.promptGenerator = new PromptGenerator(registry);
    this.toolExecutor = new ToolExecutor(registry, gameStore);
  }

  setPlayerInputHandler(handler: (resolve: (text: string) => void) => void): void {
    this.playerInputCallback = handler;
  }

  setContinueHandler(handler: (resolve: () => void) => void): void {
    this.continueCallback = handler;
  }

  async startScene(sceneId: string): Promise<void> {
    const sceneBlueprint = this.registry.getScene(sceneId);

    // Reset conversation history for new scene
    this.conversationHistory = [];

    // Build SceneModel
    this.sceneModel = {
      blueprint: sceneBlueprint,
      characters: new Map(),
      activeCharacter: sceneBlueprint.characters[0],
    };

    for (const charId of sceneBlueprint.characters) {
      const charBlueprint = this.registry.getCharacter(charId);
      const goals = sceneBlueprint.goals.filter((g) => g.character_id === charId);
      this.sceneModel.characters.set(charId, {
        blueprint: charBlueprint,
        sceneGoals: goals,
      });
    }

    this.onUpdate({ type: 'scene_loaded', scene: this.sceneModel });

    if (sceneBlueprint.intro) {
      await this.typewriteText(sceneBlueprint.intro);
    }

    await this.startConversation();
  }

  private async startConversation(): Promise<void> {
    const systemPrompt = this.promptGenerator.generateSystemPrompt(
      this.sceneModel!.blueprint.id,
      this.sceneModel!.activeCharacter
    );

    const response = await this.chatTurn('system: user entered the scene', systemPrompt);

    if (response.text) {
      await this.displayDialogue(response.text);
    }

    if (response.ended) {
      await this.endScene(response.result, response.summary);
      return;
    }

    await this.playerInputLoop();
  }

  private async playerInputLoop(): Promise<void> {
    while (true) {
      const playerInput = await this.waitForPlayerInput();

      // Show AI thinking indicator
      this.onUpdate({ type: 'ai_thinking' });

      const systemPrompt = this.promptGenerator.generateSystemPrompt(
        this.sceneModel!.blueprint.id,
        this.sceneModel!.activeCharacter
      );

      const response = await this.chatTurn(playerInput, systemPrompt);

      if (response.text) {
        await this.displayDialogue(response.text);
      }

      if (response.ended) {
        await this.endScene(response.result, response.summary);
        break;
      }
    }
  }

  private async chatTurn(
    message: string,
    systemPrompt: string
  ): Promise<{
    text: string;
    ended: boolean;
    result?: string;
    summary?: string;
  }> {
    const messages = [...this.conversationHistory];

    if (messages.length === 0) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: message });

    // Chat completion with tools
    for (let i = 0; i < 5; i++) {
      const response = await ChatService.chatCompletionsCreate({
        requestBody: {
          messages,
          tools: this.toolExecutor.getToolDefinitions(),
          tool_choice: 'auto',
        },
      });

      const aiMessage = response.choices[0].message;
      messages.push(aiMessage);

      if (!aiMessage.tool_calls) {
        // Update per-scene history
        this.conversationHistory = messages;
        return { text: aiMessage.content || '', ended: false };
      }

      // Execute tools
      for (const tc of aiMessage.tool_calls) {
        const result = this.toolExecutor.execute(
          tc.function.name,
          JSON.parse(tc.function.arguments)
        );

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });

        if (result.terminal) {
          this.conversationHistory = messages;
          return {
            text: aiMessage.content || '',
            ended: true,
            result: result.result,
            summary: result.summary,
          };
        }
      }
    }

    this.conversationHistory = messages;
    return { text: messages[messages.length - 1].content, ended: false };
  }

  private async displayDialogue(text: string): Promise<void> {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    const activeCharacter = this.sceneModel!.characters.get(this.sceneModel!.activeCharacter)!;

    for (let i = 0; i < sentences.length; i++) {
      this.onUpdate({
        type: 'dialogue_chunk',
        speaker_id: this.sceneModel!.activeCharacter,
        speaker_name: activeCharacter.blueprint.name,
        text: sentences[i].trim(),
      });

      await this.waitForContinue();
    }
  }

  private async typewriteText(text: string): Promise<void> {
    this.onUpdate({ type: 'typewriter', text });
    await new Promise((resolve) => setTimeout(resolve, text.length * 50));
  }

  private async endScene(result: string, summary: string): Promise<void> {
    if (this.sceneModel!.blueprint.outro) {
      await this.typewriteText(this.sceneModel!.blueprint.outro);
    }

    const nextSceneId = this.sceneModel!.blueprint.goals.find((g) => g.on_complete.transition_to)
      ?.on_complete.transition_to;

    if (nextSceneId) {
      this.onUpdate({ type: 'scene_transition', next_scene: nextSceneId });
    } else {
      this.onUpdate({ type: 'scene_ended', result, summary });
    }
  }

  private waitForPlayerInput(): Promise<string> {
    return new Promise((resolve) => {
      if (!this.playerInputCallback) {
        throw new Error('No player input handler registered');
      }
      this.playerInputCallback(resolve);
    });
  }

  private waitForContinue(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.continueCallback) {
        throw new Error('No continue handler registered');
      }
      this.continueCallback(resolve);
    });
  }
}

export interface SceneUpdate {
  type:
    | 'scene_loaded'
    | 'typewriter'
    | 'dialogue_chunk'
    | 'scene_transition'
    | 'scene_ended'
    | 'ai_thinking';

  speaker_id?: string;
  speaker_name?: string;
  text?: string;
  scene?: SceneModel;
  next_scene?: string;
  result?: string;
  summary?: string;
}
```

---

## Phase 3: React Components

### 3.1 Main App

```typescript
// src/App.tsx

export function App() {
  const [registry] = useState(() => new BlueprintRegistry());
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<'menu' | 'route' | 'chapter' | 'scene'>('menu');
  const gameStore = useGameStore();

  useEffect(() => {
    registry.load().then(() => {
      setLoaded(true);
      // Initialize with starting route
      const game = registry.getGame();
      const startRoute = game.starting_route;
      const route = registry.getRoute(startRoute);
      const firstChapter = route.starting_chapter;
      const chapter = registry.getChapter(firstChapter);
      const firstScene = chapter.scenes[0];

      gameStore.setCurrentScene(startRoute, firstChapter, firstScene);
      gameStore.unlockRoute(startRoute);  // Starting route is always unlocked
    });
  }, []);

  if (!loaded) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const handleRouteSelect = (routeId: string) => {
    const route = registry.getRoute(routeId);
    const firstChapter = route.starting_chapter;
    const chapter = registry.getChapter(firstChapter);
    const firstScene = chapter.scenes[0];

    gameStore.setCurrentScene(routeId, firstChapter, firstScene);
    setScreen('chapter');
  };

  const handleChapterContinue = () => {
    setScreen('scene');
  };

  return (
    <RegistryContext.Provider value={registry}>
      <ThemeProvider theme={registry.getTheme(registry.getGame().theme)}>
        {screen === 'menu' && <MainMenu onStart={() => setScreen('route')} />}
        {screen === 'route' && <RouteSelection onSelect={handleRouteSelect} />}
        {screen === 'chapter' && <ChapterIntro chapterId={gameStore.current_chapter} onContinue={handleChapterContinue} />}
        {screen === 'scene' && <SceneView />}
      </ThemeProvider>
    </RegistryContext.Provider>
  );
}
```

### 3.2 SceneView (Imperative Handles + Derived State)

```typescript
// src/components/SceneView.tsx

export function SceneView() {
  const registry = useRegistry();
  const gameStore = useGameStore();
  const game = registry.getGame();

  // Resolver state (Imperative Handle Pattern)
  const [inputResolve, setInputResolve] = useState<((text: string) => void) | null>(null);
  const [continueResolve, setContinueResolve] = useState<(() => void) | null>(null);

  // Derived UI state (no manual sync)
  const playerInputEnabled = inputResolve !== null;
  const showContinue = continueResolve !== null;

  const [sceneState, setSceneState] = useState({
    background: null as string | null,
    characters: [] as CharacterModel[],
    dialogText: '',
    speakerName: null as string | null,
    activeCharacterId: null as string | null,
    isAIThinking: false,
    showTypewriter: false,
    typewriterText: ''
  });

  const [engine] = useState(() => new GameEngine(registry, useGameStore, handleUpdate));

  // Register handlers on mount
  useEffect(() => {
    engine.setPlayerInputHandler((resolve) => setInputResolve(() => resolve));
    engine.setContinueHandler((resolve) => setContinueResolve(() => resolve));
    engine.startScene(gameStore.current_scene);
  }, []);

  function handleUpdate(update: SceneUpdate) {
    switch (update.type) {
      case 'scene_loaded':
        setSceneState({
          background: update.scene!.blueprint.view.default.uri!,
          characters: Array.from(update.scene!.characters.values()),
          dialogText: '',
          speakerName: null,
          activeCharacterId: update.scene!.activeCharacter,
          isAIThinking: false,
          showTypewriter: false,
          typewriterText: ''
        });
        break;

      case 'dialogue_chunk':
        setSceneState(prev => ({
          ...prev,
          dialogText: update.text as string,
          speakerName: update.speaker_name as string,
          isAIThinking: false
        }));
        break;

      case 'typewriter':
        setSceneState(prev => ({
          ...prev,
          showTypewriter: true,
          typewriterText: update.text as string
        }));
        setTimeout(() => {
          setSceneState(prev => ({ ...prev, showTypewriter: false }));
        }, (update.text as string).length * 50);
        break;

      case 'ai_thinking':
        setSceneState(prev => ({
          ...prev,
          isAIThinking: true,
          dialogText: '',
          speakerName: null
        }));
        break;

      case 'scene_transition':
        engine.startScene(update.next_scene as string);
        break;

      case 'scene_ended':
        console.log('Scene ended:', update.result, update.summary);
        break;
    }
  }

  const handlePlayerSubmit = (text: string) => {
    if (inputResolve) {
      inputResolve(text);
      setInputResolve(null);
    }
  };

  const handleContinue = () => {
    if (continueResolve) {
      continueResolve();
      setContinueResolve(null);
    }
  };

  // Filter out MC sprite (player POV)
  const visibleCharacters = sceneState.characters.filter(
    char => char.blueprint.id !== game.player_character_id
  );

  return (
    <div className="scene-container relative w-full h-screen overflow-hidden">
      {sceneState.background && (
        <img
          src={sceneState.background}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Scene background"
        />
      )}

      <div className="absolute inset-0 flex items-end justify-around pb-20">
        {visibleCharacters.map((char, index) => {
          const positions = ['left', 'center', 'right'] as const;
          const position = positions[index % 3];

          return (
            <CharacterSprite
              key={char.blueprint.id}
              character={char}
              isActive={char.blueprint.id === sceneState.activeCharacterId}
              position={position}
            />
          );
        })}
      </div>

      {sceneState.showTypewriter && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
          <Typewriter text={sceneState.typewriterText} />
        </div>
      )}

      <DialogBox
        speakerName={sceneState.speakerName}
        text={sceneState.dialogText}
        showContinue={showContinue}
        onContinue={handleContinue}
        isAIThinking={sceneState.isAIThinking}
      />

      <PlayerInput
        enabled={playerInputEnabled}
        onSubmit={handlePlayerSubmit}
      />

      <Dossier />
      <LanguageSelector />
    </div>
  );
}
```

### 3.3 Custom Hooks

#### 3.3.1 useTypewriter Hook

```typescript
// src/hooks/useTypewriter.ts

export function useTypewriter(text: string, speed: number = 50): string {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setDisplayText('');
    let index = 0;

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return displayText;
}
```

#### 3.3.2 useUITranslation Hook

```typescript
// src/hooks/useUITranslation.ts

export function useUITranslation() {
  const registry = useRegistry();
  const [translations, setTranslations] = useState<any>({});

  useEffect(() => {
    const lang = registry.getCurrentLanguage();
    fetch(`${import.meta.env.BASE_URL}locales/${lang}.json`)
      .then(r => r.json())
      .then(setTranslations)
      .catch(() => {
        // Fallback to English
        fetch(`${import.meta.env.BASE_URL}locales/en_US.json`)
          .then(r => r.json())
          .then(setTranslations);
      });
  }, [registry.getCurrentLanguage()]);

  const t = (key: string, fallback?: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return fallback || key;
    }
    return value || fallback || key;
  };

  return { t };
}
    return value || fallback || key;
  };

  return { t };
}
```

### 3.4 Core UI Components

#### 3.4.1 DialogBox Component

```typescript
// src/components/DialogBox.tsx

interface DialogBoxProps {
  speakerName: string | null;
  text: string;
  showContinue: boolean;
  onContinue: () => void;
  isAIThinking?: boolean;
}

export function DialogBox({ speakerName, text, showContinue, onContinue, isAIThinking }: DialogBoxProps) {
  const { t } = useUITranslation();
  const displayText = useTypewriter(text, 50);

  useEffect(() => {
    if (!showContinue) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onContinue();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showContinue, onContinue]);

  return (
    <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
      <div className="bg-black bg-opacity-80 rounded-lg p-6 max-w-4xl mx-auto">
        {speakerName && (
          <div className="text-primary font-bold mb-2">{speakerName}</div>
        )}

        {isAIThinking ? (
          <div className="text-gray-400 italic">{t('ui.thinking')}</div>
        ) : (
          <div className="text-white text-lg leading-relaxed">{displayText}</div>
        )}

        {showContinue && (
          <div className="text-right text-primary mt-2 animate-pulse">
            ▼ {t('ui.continue')}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 3.4.2 CharacterSprite Component

```typescript
// src/components/CharacterSprite.tsx

interface CharacterSpriteProps {
  character: CharacterModel;
  isActive: boolean;
  position: 'left' | 'center' | 'right';
}

export function CharacterSprite({ character, isActive, position }: CharacterSpriteProps) {
  const positionClasses = {
    left: 'justify-start pl-20',
    center: 'justify-center',
    right: 'justify-end pr-20'
  };

  const imageUri = character.blueprint.view.default.uri;

  return (
    <div className={`flex ${positionClasses[position]} transition-all duration-300`}>
      <img
        src={imageUri}
        alt={character.blueprint.name}
        className={`
          h-96 object-contain transition-all duration-300
          ${isActive
            ? 'opacity-100 scale-105 filter-none'
            : 'opacity-60 scale-95 grayscale'
          }
        `}
      />
    </div>
  );
}
```

#### 3.4.3 PlayerInput Component

```typescript
// src/components/PlayerInput.tsx

interface PlayerInputProps {
  enabled: boolean;
  onSubmit: (text: string) => void;
  placeholder?: string;
}

export function PlayerInput({ enabled, onSubmit, placeholder }: PlayerInputProps) {
  const { t } = useUITranslation();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (enabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [enabled]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && enabled) {
      onSubmit(trimmed);
      setValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  if (!enabled) return null;

  return (
    <div className="absolute bottom-32 left-0 right-0 px-8 z-10">
      <div className="max-w-4xl mx-auto flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder || t('ui.input_placeholder')}
          className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-80 disabled:opacity-50"
        >
          {t('ui.send')}
        </button>
      </div>
    </div>
  );
}
```

#### 3.4.4 Typewriter Component

```typescript
// src/components/Typewriter.tsx

interface TypewriterProps {
  text: string;
}

export function Typewriter({ text }: TypewriterProps) {
  const displayText = useTypewriter(text, 50);

  return (
    <div className="text-white text-2xl text-center max-w-2xl p-8">
      {displayText}
    </div>
  );
}
```

#### 3.4.5 Dossier Component

```typescript
// src/components/Dossier.tsx

export function Dossier() {
  const { t } = useUITranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { dossier } = useGameStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 right-4 p-3 bg-black bg-opacity-50 rounded-lg text-white hover:bg-opacity-70 z-20"
      >
        📋 {t('ui.dossier.title')}
      </button>

      {isOpen && (
        <div
          className="absolute inset-0 bg-black bg-opacity-90 z-30 flex items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-gray-900 rounded-lg p-8 max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-primary mb-6">{t('ui.dossier.title')}</h2>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-3">{t('ui.dossier.objectives')}</h3>
              {dossier.objectives.length === 0 ? (
                <p className="text-gray-400 italic">{t('ui.dossier.no_objectives')}</p>
              ) : (
                <ul className="space-y-2">
                  {dossier.objectives.map((obj, i) => (
                    <li key={i} className="text-white flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">{t('ui.dossier.notes')}</h3>
              {dossier.notes.length === 0 ? (
                <p className="text-gray-400 italic">{t('ui.dossier.no_notes')}</p>
              ) : (
                <ul className="space-y-2">
                  {dossier.notes.map((note, i) => (
                    <li key={i} className="text-gray-300 flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full px-4 py-2 bg-primary text-white rounded hover:bg-opacity-80"
            >
              {t('ui.close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

### 3.5 Menu Components

#### 3.5.1 MainMenu Component

```typescript
// src/components/MainMenu.tsx

interface MainMenuProps {
  onStart: () => void;
}

export function MainMenu({ onStart }: MainMenuProps) {
  const { t } = useUITranslation();
  const game = useRegistry().getGame();
  const hasSave = !!localStorage.getItem('vn_save');

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">{game.title}</h1>
        <p className="text-xl text-gray-400 mb-12">{game.description}</p>

        <div className="space-y-4">
          <button
            onClick={onStart}
            className="block w-64 mx-auto px-8 py-4 bg-primary text-white text-xl rounded-lg hover:bg-opacity-80"
          >
            {t('ui.new_game')}
          </button>

          {hasSave && (
            <button
              onClick={() => {/* Load game */}}
              className="block w-64 mx-auto px-8 py-4 bg-gray-700 text-white text-xl rounded-lg hover:bg-gray-600"
            >
              {t('ui.continue_game')}
            </button>
          )}

          <button
            className="block w-64 mx-auto px-8 py-4 bg-gray-800 text-white text-xl rounded-lg hover:bg-gray-700"
          >
            {t('ui.settings')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 3.5.2 RouteSelection Component

```typescript
// src/components/RouteSelection.tsx

interface RouteSelectionProps {
  onSelect: (routeId: string) => void;
}

export function RouteSelection({ onSelect }: RouteSelectionProps) {
  const registry = useRegistry();
  const game = registry.getGame();
  const { unlocked_routes } = useGameStore();

  const routes = game.routes.map(id => registry.getRoute(id));

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">Choose Your Path</h2>

        <div className="grid gap-6">
          {routes.map(route => {
            const isLocked = route.requirements &&
              !unlocked_routes.includes(route.id);

            return (
              <button
                key={route.id}
                onClick={() => !isLocked && onSelect(route.id)}
                disabled={isLocked}
                className={`
                  p-6 rounded-lg text-left transition-all
                  ${isLocked
                    ? 'bg-gray-800 opacity-50 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-gray-700 hover:scale-105'
                  }
                `}
              >
                <h3 className="text-2xl font-bold text-primary mb-2">
                  {route.title} {isLocked && '🔒'}
                </h3>
                <p className="text-gray-300">{route.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

#### 3.5.3 ChapterIntro Component

```typescript
// src/components/ChapterIntro.tsx

interface ChapterIntroProps {
  chapterId: string;
  onContinue: () => void;
}

export function ChapterIntro({ chapterId, onContinue }: ChapterIntroProps) {
  const { t } = useUITranslation();
  const chapter = useRegistry().getChapter(chapterId);
  const displayText = useTypewriter(chapter.intro, 50);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContinue(true);
    }, chapter.intro.length * 50 + 500);

    return () => clearTimeout(timer);
  }, [chapter.intro]);

  useEffect(() => {
    if (!showContinue) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onContinue();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showContinue, onContinue]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center max-w-2xl px-8">
        <h2 className="text-4xl font-bold text-primary mb-8">{chapter.title}</h2>
        <p className="text-2xl text-white leading-relaxed">{displayText}</p>

        {showContinue && (
          <div className="text-primary mt-8 animate-pulse">
            {t('ui.press_enter')}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3.6 System Components

#### 3.6.1 LanguageSelector Component

```typescript
// src/components/LanguageSelector.tsx

export function LanguageSelector() {
  const registry = useRegistry();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(registry.getCurrentLanguage());
  const availableLanguages = registry.getAvailableLanguages();

  const languageNames: Record<string, string> = {
    'en_US': '🇺🇸 English',
    'ko_KR': '🇰🇷 한국어',
    'fr_FR': '🇫🇷 Français',
    'de_DE': '🇩🇪 Deutsch',
    'it_IT': '🇮🇹 Italiano',
    'pt_BR': '🇧🇷 Português',
    'ru_RU': '🇷🇺 Русский',
    'ja_JP': '🇯🇵 日本語',
    'ko_KR': '🇰🇷 한국어',
    'zh_CN': '🇨🇳 简体中文',
    'zh_TW': '🇹🇼 繁體中文'
  };

  const handleLanguageChange = async (lang: string) => {
    try {
      await registry.switchLanguage(lang);
      setCurrentLanguage(lang);
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-black bg-opacity-50 rounded-lg text-white hover:bg-opacity-70"
      >
        {languageNames[currentLanguage] || currentLanguage}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 bg-gray-900 rounded-lg overflow-hidden shadow-lg min-w-[200px]">
          {availableLanguages.map(lang => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`
                block w-full px-4 py-2 text-left transition-colors
                ${lang === currentLanguage
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-800'
                }
              `}
            >
              {languageNames[lang] || lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 3.6.2 ThemeProvider Component

```typescript
// src/components/ThemeProvider.tsx

interface ThemeProviderProps {
  theme: ThemeBlueprint;
  children: ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;

    // Apply color CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply font CSS variables
    Object.entries(theme.fonts).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });

    // Apply UI CSS variables (convert snake_case to kebab-case)
    if (theme.ui) {
      Object.entries(theme.ui).forEach(([key, value]) => {
        root.style.setProperty(`--${key.replace(/_/g, '-')}`, value);
      });
    }
  }, [theme]);

  return <div className="theme-root">{children}</div>;
}
```

---

## Phase 4: Blueprint File Structure (Multi-Language)

```
public/
├── blueprints/
│   ├── game.json                ← LANGUAGE-AGNOSTIC (shared)
│   ├── languages.json           ["en_US", "ko_KR"]
│   ├── en_US/
│   │   ├── routes.json
│   │   ├── chapters.json
│   │   ├── characters/
│   │   │   ├── index.json       ["mc", "riley"]
│   │   │   ├── mc.json
│   │   │   └── riley.json
│   │   ├── scenes/
│   │   │   ├── index.json       ["scene_1", "scene_1_success"]
│   │   │   ├── scene_1.json
│   │   │   └── scene_1_success.json
│   │   └── items/
│   │       └── index.json       []
│   └── ko_KR/
│       ├── routes.json
│       ├── chapters.json
│       └── ...
├── assets/                      ← SHARED across languages
│   ├── characters/
│   │   ├── mc_default.png
│   │   └── riley_default.png
│   ├── backgrounds/
│   │   └── scene_1_default.png
│   └── audio/
│       └── theme.mp3
├── themes/                      ← LANGUAGE-AGNOSTIC themes
│   ├── default.json
│   ├── miami_metro.json
│   └── cyberpunk_2077.json
└── locales/                     ← Framework UI strings
    ├── en_US.json
    └── ko_KR.json
```

### Example Files

**languages.json**:

```json
["en_US", "ko_KR"]
```

**game.json** (language-agnostic):

```json
{
  "id": "example_game",
  "title": "My Visual Novel",
  "version": "1.0.0",
  "description": "An AI-driven story adventure",
  "authors": ["Your Name"],
  "player_character_id": "mc",
  "routes": ["main_route"],
  "starting_route": "main_route",
  "main_menu_image": {
    "uri": "/assets/backgrounds/main_menu.svg"
  },
  "theme": "default"
}
```

**Note**: The `language` field has been removed as game.json is now language-agnostic. The current language is determined by the BlueprintRegistry based on user selection or browser settings.

**en_US/routes.json**:

```json
[
  {
    "id": "main_route",
    "title": "Main Story",
    "description": "The primary narrative",
    "chapters": ["chapter_1"],
    "starting_chapter": "chapter_1"
  }
]
```

**en_US/chapters.json**:

```json
[
  {
    "id": "chapter_1",
    "title": "Chapter 1: The Beginning",
    "intro": "You wake up in a strange place...",
    "scenes": ["scene_1", "scene_1_success"]
  }
]
```

**en_US/characters/mc.json**:

```json
{
  "id": "mc",
  "name": "Alex",
  "role": "player",
  "view": {
    "default": { "uri": "/assets/characters/mc_default.png" }
  },
  "identity": {
    "personality": "Curious and determined",
    "background": "A regular person thrust into extraordinary circumstances",
    "speaking_style": "Direct and pragmatic"
  },
  "voice": { "gender": "neutral" },
  "inventory": []
}
```

**en_US/characters/riley.json**:

```json
{
  "id": "riley",
  "name": "Riley",
  "role": "npc",
  "view": {
    "default": { "uri": "/assets/characters/riley_default.png" }
  },
  "identity": {
    "personality": "Mysterious and knowledgeable",
    "background": "Has information about the situation",
    "speaking_style": "Cryptic but helpful"
  },
  "voice": { "gender": "neutral" },
  "inventory": []
}
```

**en_US/scenes/scene_1.json**:

```json
{
  "id": "scene_1",
  "title": "First Encounter",
  "view": {
    "default": { "uri": "/assets/backgrounds/scene_1_default.png" }
  },
  "prompt": "You meet a mysterious stranger who seems to know something about your situation.",
  "characters": ["mc", "riley"],
  "intro": "A figure approaches you in the dim light...",
  "goals": [
    {
      "id": "befriend_riley",
      "character_id": "riley",
      "description": "Establish trust with the player",
      "on_complete": { "transition_to": "scene_1_success" }
    }
  ]
}
```

**en_US/themes/default.json**:

```json
{
  "id": "default",
  "name": "Default Theme",
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#8B5CF6",
    "background": "#111827",
    "text": "#F9FAFB",
    "accent": "#06B6D4",
    "border": "#3B82F6",
    "shadow": "#8B5CF6",
    "success": "#10B981",
    "error": "#EF4444",
    "character_player": "#06B6D4",
    "character_npc": "#8B5CF6"
  },
  "fonts": {
    "heading": "system-ui, sans-serif",
    "body": "system-ui, sans-serif",
    "dialogue": "Georgia, serif"
  },
  "transitions": {
    "scene_fade_duration": 500,
    "text_speed": 50
  },
  "ui": {
    "border_width": "2px",
    "border_style": "solid",
    "box_shadow": "0 4px 6px rgba(0, 0, 0, 0.1)",
    "button_transform": "translateY(-2px)",
    "button_shadow_hover": "0 6px 12px rgba(0, 0, 0, 0.15)"
  }
}
```

**locales/en_US.json**:

```json
{
  "ui": {
    "continue": "Continue...",
    "send": "Send",
    "thinking": "Thinking...",
    "input_placeholder": "Type your response...",
    "close": "Close",
    "new_game": "New Game",
    "continue_game": "Continue",
    "settings": "Settings",
    "press_enter": "Press Enter to continue...",
    "dossier": {
      "title": "Dossier",
      "objectives": "Objectives",
      "notes": "Notes",
      "no_objectives": "No objectives yet",
      "no_notes": "No notes yet"
    }
  }
}
```

**locales/ko_KR.json**:

```json
{
  "ui": {
    "continue": "계속...",
    "send": "보내기",
    "thinking": "생각 중...",
    "input_placeholder": "답변을 입력하세요...",
    "close": "닫기",
    "new_game": "새 게임",
    "continue_game": "이어하기",
    "settings": "설정",
    "press_enter": "계속하려면 Enter를 누르세요...",
    "dossier": {
      "title": "서류",
      "objectives": "목표",
      "notes": "메모",
      "no_objectives": "아직 목표 없음",
      "no_notes": "아직 메모 없음"
    }
  }
}
```

---

## Phase 5: UI & Theming (Tailwind + Shadcn)

### 5.1 Setup

```bash
npm create vite@latest my-visual-novel -- --template react-ts
cd my-visual-novel
npm install
npm install zustand @player2-game/sdk
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 5.2 Tailwind Configuration

```javascript
// tailwind.config.js
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
};
```

### 5.3 Styling Strategy - Universal Pluggable Theme System

**CRITICAL**: Use universal `.vn-*` classes so component code NEVER changes when switching themes.

#### Universal Class System

All components must use these universal classes:

- `.vn-screen` - Full-screen containers (menus, route selection, chapter intros)
- `.vn-heading` - Headings, titles, labels
- `.vn-text` - Body text, dialogue, descriptions
- `.vn-box` - Containers, dialog boxes, panels
- `.vn-button` - Primary action buttons
- `.vn-button-secondary` - Secondary/alternate buttons
- `.vn-button-accent` - Special emphasis buttons
- `.vn-input` - Text input fields

#### Implementation Structure

**1. Base Styles** (`src/index.css`)

```css
/* Defines universal .vn-* classes with CSS variables */
.vn-heading {
  font-family: var(--font-heading, system-ui, sans-serif);
  line-height: 1.6;
}

.vn-text {
  font-family: var(--font-body, system-ui, sans-serif);
  line-height: 1.4;
}

.vn-box {
  border: var(--border-width, 2px) solid var(--color-border);
  box-shadow: var(--box-shadow, 0 4px 6px rgba(0, 0, 0, 0.1));
  background: var(--box-background, var(--color-background));
}

.vn-button {
  font-family: var(--font-heading, system-ui, sans-serif);
  padding: var(--button-padding, 12px 24px);
  background: var(--button-background, var(--color-primary));
  color: var(--button-text-color, white);
  border: var(--button-border-width, 2px) solid var(--color-border);
  box-shadow: var(--button-shadow, 0 4px 6px rgba(0, 0, 0, 0.1));
  transition: all 0.2s ease;
  cursor: pointer;
}

.vn-button:hover {
  transform: var(--button-hover-transform, translateY(-2px));
  box-shadow: var(--button-shadow-hover, 0 6px 12px rgba(0, 0, 0, 0.15));
}

.vn-button-secondary {
  background: var(--button-secondary-background, transparent);
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}

.vn-input {
  font-family: var(--font-body, system-ui, sans-serif);
  color: var(--color-text);
  background-color: var(--color-background);
  border: var(--input-border-width, 2px) solid var(--color-secondary);
  padding: var(--input-padding, 12px 16px);
}

.vn-screen {
  position: relative;
}
```

**2. Theme CSS Files** (`src/themes/{theme-name}.css`)

Each theme styles the `.vn-*` classes differently:

```css
/* src/themes/cyberpunk-2077.css */
@import url('https://fonts.googleapis.com/css2?family=Orbitron&family=Rajdhani&display=swap');

:root {
  --font-size-base: 16px;
  --button-padding: 14px 28px;
  --border-width: 2px;
  --box-shadow: 0 0 20px var(--color-shadow);
}

body {
  font-family: 'Rajdhani', sans-serif;
}

.vn-heading {
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  text-shadow: 0 0 10px var(--color-primary);
}

.vn-box {
  background: linear-gradient(135deg, rgba(10, 14, 26, 0.9), rgba(26, 31, 53, 0.95));
  border: 2px solid;
  border-image: linear-gradient(135deg, var(--color-primary), var(--color-accent)) 1;
}

/* Optional theme-specific effects */
.cyber-grid {
  position: fixed;
  background-image:
    linear-gradient(rgba(255, 223, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 223, 0, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}
```

**3. Theme Blueprints** (`public/themes/{theme_id}.json`)

**⚠️ IMPORTANT**: Themes are language-agnostic (visual only, no text) and stored in `public/themes/`, NOT in language-specific folders.

Define colors, fonts, and UI properties:

```json
{
  "id": "cyberpunk_2077",
  "name": "Cyberpunk 2077",
  "colors": {
    "primary": "#FFDF00",
    "secondary": "#00F0FF",
    "background": "#0A0E1A",
    "text": "#E0E0E0",
    "accent": "#FF003C",
    "border": "#FFDF00",
    "shadow": "#FF003C",
    "success": "#00FF9F",
    "error": "#FF003C"
  },
  "fonts": {
    "heading": "'Orbitron', sans-serif",
    "body": "'Rajdhani', sans-serif",
    "dialogue": "'Rajdhani', sans-serif"
  },
  "transitions": {
    "scene_fade_duration": 400,
    "text_speed": 25
  },
  "ui": {
    "border_width": "2px",
    "box_shadow": "0 0 20px var(--color-shadow)",
    "button_transform": "translateY(-2px) scale(1.02)"
  }
}
```

**4. Switching Themes**

Only requires changing the import in `src/main.tsx`:

```typescript
// Switch themes by changing this one line:
import './themes/cyberpunk-2077.css'; // ← Change this
// Options: './themes/default.css', './themes/miami-metro.css', etc.

import './index.css';
```

And updating `public/blueprints/game.json`:

```json
{ "theme": "cyberpunk_2077" }
```

**NO component code changes needed!**

#### Component Usage Examples

```tsx
// ✅ CORRECT: Always use universal .vn-* classes
<div className="vn-screen min-h-screen">
  <h1 className="vn-heading text-4xl">Title</h1>
  <div className="vn-box p-6">
    <p className="vn-text">Content</p>
  </div>
  <button className="vn-button">Primary</button>
  <button className="vn-button vn-button-secondary">Secondary</button>
  <input className="vn-input" placeholder="Type..." />
</div>

// ✅ Use CSS variables for colors
<div style={{ color: 'var(--color-primary)' }}>
  Themed color
</div>

// ❌ NEVER use theme-specific classes
<h1 className="retro-heading">Wrong!</h1>
<h1 className="cyber-heading">Wrong!</h1>

// ❌ NEVER hardcode colors
<div style={{ color: '#FF0000' }}>Wrong!</div>
```

#### Additional Notes

- **Responsive**: Use Tailwind utility classes alongside `.vn-*` classes
- **Transitions**: Configurable via `theme.transitions` in blueprint
- **Optional effects**: Themes can add extra classes (e.g., `.cyber-grid`, `.neon-text`)
- **Complete separation**: Theme CSS never imported in components, only in `main.tsx`
- **Documentation**: See `agents/THEME_SYSTEM.md` for comprehensive guide

---

## Phase 6: Asset Integration

### 6.1 Image Loading

- Use `ImageBlueprint.uri` directly in `<img src={...} />`
- Support inline data URIs and relative paths
- All assets in `public/assets/` are served statically

### 6.2 Audio (Future Enhancement)

- Use `AudioBlueprint.uri` with HTML5 Audio API
- Background music: loop + volume control
- Sound effects: play on events

### 6.3 Voice (Future Enhancement)

- `VoiceBlueprint.prompt` → TTS API
- Cache generated audio

---

## Phase 7: GitHub Template Setup

### 7.1 Repository Structure

```
template-repo/
├── src/
│   ├── core/
│   │   ├── BlueprintRegistry.ts
│   │   ├── GameEngine.ts
│   │   ├── ToolExecutor.ts
│   │   └── PromptGenerator.ts
│   ├── stores/
│   │   └── gameStore.ts
│   ├── types/
│   │   ├── blueprints.ts
│   │   ├── models.ts
│   │   └── state.ts
│   ├── components/
│   │   ├── App.tsx
│   │   ├── SceneView.tsx
│   │   ├── DialogBox.tsx
│   │   ├── CharacterSprite.tsx
│   │   ├── PlayerInput.tsx
│   │   ├── Dossier.tsx
│   │   ├── LanguageSelector.tsx
│   │   ├── MainMenu.tsx
│   │   ├── RouteSelection.tsx
│   │   ├── ChapterIntro.tsx
│   │   ├── Typewriter.tsx
│   │   └── ThemeProvider.tsx
│   ├── hooks/
│   │   ├── useTypewriter.ts
│   │   └── useUITranslation.ts
│   ├── contexts/
│   │   └── RegistryContext.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   ├── blueprints/
│   │   ├── languages.json
│   │   └── en_US/           (Minimal working example)
│   ├── assets/
│   │   ├── characters/
│   │   └── backgrounds/
│   └── locales/
│       ├── en_US.json
│       └── es_ES.json
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── README.md
└── DOCS/
    ├── BLUEPRINTS.md
    ├── TOOLS.md
    ├── MULTI_LANGUAGE.md
    └── THEMING.md
```

### 7.2 Example Game

Minimal working example included:

- 1 MC character ("Alex")
- 1 NPC character ("Riley")
- 1 scene ("First Encounter")
- 1 chapter ("Prologue")
- 1 route ("Main Story")
- All required assets (placeholders)
- Two languages: en_US, ko_KR

### 7.3 Documentation Files

**README.md**: Quick start guide

- Clone and install
- Run dev server
- Customize blueprints
- Add new languages

**DOCS/BLUEPRINTS.md**: Complete blueprint reference

- All blueprint types
- Field descriptions
- Example configurations

**DOCS/TOOLS.md**: Tool reference

- All 6 tools
- Parameters
- Usage examples

**DOCS/MULTI_LANGUAGE.md**: Multi-language guide

- How to add new languages
- Translation workflow
- AI language instruction

**DOCS/THEMING.md**: Theming guide

- Color customization
- Font configuration
- Component styling

---

## Phase 8: Multi-Language Support Implementation

### 8.1 Creating Multi-Language Games

**Step 1**: Create base language (e.g., `en_US/`)

```bash
mkdir -p public/blueprints/en_US
# Create all blueprints in en_US/
```

**Step 2**: Duplicate for new language

```bash
cp -r public/blueprints/en_US public/blueprints/ko_KR
```

**Step 3**: Translate all JSON files in `ko_KR/` folder

- Character names, personalities, backgrounds
- Scene titles, prompts, intros, outros
- Chapter titles, intros
- Route titles, descriptions
- Goal descriptions

**Step 4**: Update `languages.json`

```json
["en_US", "ko_KR"]
```

**Step 5**: Create UI translation file `locales/ko_KR.json`

**Step 6**: Test language switching via LanguageSelector

### 8.2 How Multi-Language Works

1. **On Game Load**:
   - BlueprintRegistry reads `languages.json`
   - Auto-detects language: localStorage → browser → fallback
   - Loads blueprints from `/blueprints/{language}/`

2. **AI Language Instruction**:
   - PromptGenerator reads `game.language`
   - Adds **CRITICAL LANGUAGE REQUIREMENT** to system prompt
   - AI responds in correct language automatically

3. **Language Switching**:
   - Player clicks LanguageSelector
   - Calls `registry.switchLanguage(newLang)`
   - Reloads all blueprints from new language folder
   - Reloads app to apply changes

### 8.3 Validation (Future)

Create validation tool to ensure all languages have same structure:

```bash
npm run validate:languages
```

---

## Summary

### All Resolved Design Decisions:

1. ✓ State management: Zustand
2. ✓ Dependency injection: React Context
3. ✓ GameEngine ↔ React: Imperative Handle Pattern + Derived State
4. ✓ Conversation history: Per-scene (resets on scene change)
5. ✓ Goal checking: AI decides via tools (no programmatic condition checking)
6. ✓ Multi-language: Per-folder blueprint trees
7. ✓ Speaker display: Explicit speaker info in SceneUpdate events
8. ✓ Player messages: Hidden, show AI thinking indicator
9. ✓ Character positioning: Auto left/center/right by index
10. ✓ MC sprite: Filtered out (player POV)
11. ✓ Typewriter: useTypewriter hook (reusable)
12. ✓ UI translations: useUITranslation hook + locales files
13. ✓ **Theme system: Universal pluggable themes with `.vn-*` classes (Phase 5.3)**
14. ✓ **Theme switching: No component code changes needed**
15. ✓ **ThemeProvider: Dynamically applies colors, fonts, UI properties as CSS variables**

### Non-Blocking Future Enhancements:

- Hot reloading for blueprints
- Schema validation on load
- Error boundaries
- Cloud save system
- Asset generation tools
- Mock testing without API
- History truncation strategy

---

## Implementation Order

1. Setup: Vite + React + TypeScript + Tailwind
2. Define all TypeScript types (Phase 1) - **Include complete ThemeBlueprint interface**
3. Implement BlueprintRegistry with multi-language (Phase 2.1) - **Include theme loading**
4. Implement GameState (Zustand) (Phase 2.2)
5. Implement ToolExecutor (Phase 2.3)
6. Implement PromptGenerator with language instruction (Phase 2.4)
7. Implement GameEngine with per-scene history (Phase 2.5)
8. **Create `src/index.css` with universal `.vn-*` classes (Phase 5.3)**
9. **Create base theme files: `src/themes/default.css`, `miami-metro.css`, `cyberpunk-2077.css`**
10. **Implement ThemeProvider component (Phase 3.6.2)**
11. Build all React components (Phase 3) - **Use `.vn-*` classes, NOT theme-specific classes**
12. Implement useTypewriter and useUITranslation hooks (Phase 3)
13. Create blueprint file structure (Phase 4)
14. **Create theme blueprints in `public/themes/`: `default.json`, `miami-metro.json`, `cyberpunk-2077.json`**
15. Create minimal example blueprints in en_US - **Include complete theme with 11 colors**
16. Add Korean translation (ko_KR) - **Do NOT duplicate themes (they're language-agnostic)**
17. Test multi-language switching
18. **Test theme switching (change import in main.tsx)**
19. Write documentation - **Include `agents/THEME_SYSTEM.md`**
20. Create GitHub template

**CRITICAL**: When implementing components (step 11), ALWAYS use universal `.vn-*` classes. Never use theme-specific class names like `.retro-button` or `.cyber-heading`. See Phase 5.3 for complete guide.
