import { create } from 'zustand';
import { GameState } from '../types/state';
import { ItemBlueprint } from '../types/blueprints';

interface GameStore extends GameState {
  introduced_characters: string[];
  markCharacterIntroduced: (charId: string) => void;
  setAffinity: (charId: string, delta: number) => void;
  setFlag: (flagId: string, value: boolean) => void;
  setVar: (key: string, value: unknown) => void;
  addItem: (item: ItemBlueprint) => void;
  removeItem: (itemId: string) => void;
  transferItem: (fromId: string, toId: string, itemId: string) => void;
  updateDossier: (type: 'objective' | 'note', text: string) => void;
  clearObjectives: () => void;
  setCurrentScene: (route: string, chapter: string, scene: string) => void;
  unlockRoute: (routeId: string) => void;
  reset: () => void;
  save: () => void;
  load: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  affinity: {},
  flags: {},
  vars: {},
  inventory: [],
  dossier: { objectives: [], notes: [] },
  current_route: '',
  current_chapter: '',
  current_scene: '',
  unlocked_routes: [],
  introduced_characters: [],

  markCharacterIntroduced: (charId) =>
    set((state) => ({
      introduced_characters: state.introduced_characters.includes(charId)
        ? state.introduced_characters
        : [...state.introduced_characters, charId],
    })),

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

  transferItem: (_fromId, _toId, itemId) => {
    set((state) => {
      if (state.inventory.some((i) => i.id === itemId)) {
        return state;
      }
      return state;
    });
  },

  updateDossier: (type, text) =>
    set((state) => {
      const key = type === 'objective' ? 'objectives' : 'notes';
      const currentItems = state.dossier[key];

      // Check if the item already exists to avoid duplicates
      if (currentItems.includes(text)) {
        return state;
      }

      return {
        dossier: {
          ...state.dossier,
          [key]: [...currentItems, text],
        },
      };
    }),

  clearObjectives: () =>
    set((state) => ({
      dossier: {
        ...state.dossier,
        objectives: [],
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
      introduced_characters: [],
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
