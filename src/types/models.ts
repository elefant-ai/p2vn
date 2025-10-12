import { CharacterBlueprint, GoalBlueprint, SceneBlueprint } from './blueprints';

export interface CharacterModel {
  blueprint: CharacterBlueprint;
  sceneGoals: GoalBlueprint[];
}

export interface SceneModel {
  blueprint: SceneBlueprint;
  characters: Map<string, CharacterModel>;
  activeCharacter: string;
}
