export interface ImageBlueprint {
  prompt?: string;
  uri?: string;
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
  introduction?: string;

  view: {
    default: ImageBlueprint;
    [state: string]: ImageBlueprint;
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
  character_id?: string;
  description: string;

  on_complete: {
    transition_to?: string;
    give_items?: string[];
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

  prompt: string;

  characters: string[];

  goals: GoalBlueprint[];

  intro?: string;
  outro?: string;
}

export interface ChapterBlueprint {
  id: string;
  title: string;
  intro: string;
  scenes: string[];
}

export interface RouteBlueprint {
  id: string;
  title: string;
  description: string;
  chapters: string[];
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
    primary: string;
    secondary: string;
    background: string;
    text: string;
    [key: string]: string;
  };

  fonts: {
    heading: string;
    body: string;
    dialogue: string;
  };

  transitions?: {
    scene_fade_duration?: number;
    text_speed?: number;
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

  player_character_id: string;
  routes: string[];
  starting_route: string;

  main_menu_image?: ImageBlueprint;

  initial_state?: {
    flags?: Record<string, boolean>;
    vars?: Record<string, unknown>;
    unlocked_routes?: string[];
  };

  theme: string;

  settings?: {
    auto_save?: boolean;
    text_speed?: number;
    voice_enabled?: boolean;
    music_volume?: number;
    sfx_volume?: number;
  };
}
