import { ItemBlueprint } from './blueprints';

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
