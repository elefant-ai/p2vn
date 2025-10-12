import {
  CharacterBlueprint,
  SceneBlueprint,
  ChapterBlueprint,
  RouteBlueprint,
  ItemBlueprint,
  ThemeBlueprint,
  GameBlueprint,
} from '../types/blueprints';

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
    const languagesResponse = await fetch(`${import.meta.env.BASE_URL}blueprints/languages.json`);
    this.availableLanguages = await languagesResponse.json();

    const targetLanguage = language || this.detectLanguage();
    this.currentLanguage = targetLanguage;

    const basePath = `${import.meta.env.BASE_URL}blueprints/${targetLanguage}`;

    this.game = await fetch(`${import.meta.env.BASE_URL}blueprints/game.json`).then((r) =>
      r.json()
    );

    const charIds = await fetch(`${basePath}/characters/index.json`).then((r) => r.json());
    for (const id of charIds) {
      const char = await fetch(`${basePath}/characters/${id}.json`).then((r) => r.json());
      this.characters.set(id, char);
    }

    const sceneIds = await fetch(`${basePath}/scenes/index.json`).then((r) => r.json());
    for (const id of sceneIds) {
      const scene = await fetch(`${basePath}/scenes/${id}.json`).then((r) => r.json());
      this.scenes.set(id, scene);
    }

    const chapters = await fetch(`${basePath}/chapters.json`).then((r) => r.json());
    chapters.forEach((ch: ChapterBlueprint) => this.chapters.set(ch.id, ch));

    const routes = await fetch(`${basePath}/routes.json`).then((r) => r.json());
    routes.forEach((rt: RouteBlueprint) => this.routes.set(rt.id, rt));

    const itemIds = await fetch(`${basePath}/items/index.json`).then((r) => r.json());
    for (const id of itemIds) {
      const item = await fetch(`${basePath}/items/${id}.json`).then((r) => r.json());
      this.items.set(id, item);
    }

    // Load theme (themes are language-agnostic)
    if (this.game && this.themes.size === 0) {
      const theme = await fetch(`${import.meta.env.BASE_URL}themes/${this.game.theme}.json`).then(
        (r) => r.json()
      );
      this.themes.set(theme.id, theme);
    }
  }

  private detectLanguage(): string {
    const saved = localStorage.getItem('game_language');
    if (saved && this.availableLanguages.includes(saved)) return saved;

    const browserLang = navigator.language.replace('-', '_');
    if (this.availableLanguages.includes(browserLang)) return browserLang;

    return this.availableLanguages[0] || 'en_US';
  }

  async switchLanguage(language: string): Promise<void> {
    if (!this.availableLanguages.includes(language)) {
      throw new Error(`Language ${language} not available`);
    }

    // Clear language-specific blueprints (themes are language-agnostic, so don't clear)
    this.characters.clear();
    this.scenes.clear();
    this.chapters.clear();
    this.routes.clear();
    this.items.clear();

    await this.load(language);

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

  getItem(id: string): ItemBlueprint | null {
    const item = this.items.get(id);
    return item || null;
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
