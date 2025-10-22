import {
  CharacterBlueprint,
  SceneBlueprint,
  ChapterBlueprint,
  RouteBlueprint,
  ItemBlueprint,
  ThemeBlueprint,
  GameBlueprint,
} from '../types/blueprints';
import { resolveAssetPath } from '../utils/assetPath';

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

  private async fetchJson<T>(url: string, blueprintName: string): Promise<T> {
    const response = await fetch(url);
    try {
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to parse JSON for blueprint "${blueprintName}": ${error}`);
    }
  }

  private transformCharacterBlueprint(char: CharacterBlueprint): CharacterBlueprint {
    return {
      ...char,
      view: Object.entries(char.view).reduce(
        (acc, [key, view]) => ({
          ...acc,
          [key]: {
            ...view,
            uri: resolveAssetPath(view.uri),
          },
        }),
        {} as CharacterBlueprint['view']
      ),
      inventory: char.inventory.map((item) => ({
        ...item,
        image: {
          ...item.image,
          uri: resolveAssetPath(item.image.uri),
        },
      })),
    };
  }

  private transformSceneBlueprint(scene: SceneBlueprint): SceneBlueprint {
    return {
      ...scene,
      view: Object.entries(scene.view).reduce(
        (acc, [key, view]) => ({
          ...acc,
          [key]: {
            ...view,
            uri: resolveAssetPath(view.uri),
          },
        }),
        {} as SceneBlueprint['view']
      ),
    };
  }

  private transformItemBlueprint(item: ItemBlueprint): ItemBlueprint {
    return {
      ...item,
      image: {
        ...item.image,
        uri: resolveAssetPath(item.image.uri),
      },
    };
  }

  private transformGameBlueprint(game: GameBlueprint): GameBlueprint {
    return {
      ...game,
      main_menu_image: game.main_menu_image
        ? {
            ...game.main_menu_image,
            uri: resolveAssetPath(game.main_menu_image.uri),
          }
        : undefined,
    };
  }

  private transformThemeBlueprint(theme: ThemeBlueprint): ThemeBlueprint {
    return theme;
  }

  async load(language?: string): Promise<void> {
    this.availableLanguages = await this.fetchJson<string[]>(
      `${import.meta.env.BASE_URL}blueprints/languages.json`,
      'languages.json'
    );

    const targetLanguage = language || this.detectLanguage();
    this.currentLanguage = targetLanguage;

    const basePath = `${import.meta.env.BASE_URL}blueprints/${targetLanguage}`;

    const gameBp = await this.fetchJson<GameBlueprint>(
      `${import.meta.env.BASE_URL}blueprints/game.json`,
      'game.json'
    );
    this.game = this.transformGameBlueprint(gameBp);

    const charIds = await this.fetchJson<string[]>(
      `${basePath}/characters/index.json`,
      'characters/index.json'
    );
    for (const id of charIds) {
      const charBp = await this.fetchJson<CharacterBlueprint>(
        `${basePath}/characters/${id}.json`,
        `characters/${id}.json`
      );
      this.characters.set(id, this.transformCharacterBlueprint(charBp));
    }

    const sceneIds = await this.fetchJson<string[]>(
      `${basePath}/scenes/index.json`,
      'scenes/index.json'
    );
    for (const id of sceneIds) {
      const sceneBp = await this.fetchJson<SceneBlueprint>(
        `${basePath}/scenes/${id}.json`,
        `scenes/${id}.json`
      );
      this.scenes.set(id, this.transformSceneBlueprint(sceneBp));
    }

    const chapters = await this.fetchJson<ChapterBlueprint[]>(
      `${basePath}/chapters.json`,
      'chapters.json'
    );
    chapters.forEach((ch: ChapterBlueprint) => this.chapters.set(ch.id, ch));

    const routes = await this.fetchJson<RouteBlueprint[]>(`${basePath}/routes.json`, 'routes.json');
    routes.forEach((rt: RouteBlueprint) => this.routes.set(rt.id, rt));

    const itemIds = await this.fetchJson<string[]>(
      `${basePath}/items/index.json`,
      'items/index.json'
    );
    for (const id of itemIds) {
      const itemBp = await this.fetchJson<ItemBlueprint>(
        `${basePath}/items/${id}.json`,
        `items/${id}.json`
      );
      this.items.set(id, this.transformItemBlueprint(itemBp));
    }

    if (this.game && this.themes.size === 0) {
      const themeBp = await this.fetchJson<ThemeBlueprint>(
        `${import.meta.env.BASE_URL}themes/${this.game.theme}.json`,
        `themes/${this.game.theme}.json`
      );
      this.themes.set(themeBp.id, this.transformThemeBlueprint(themeBp));
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
