import { SceneModel } from '../types/models';
import { BlueprintRegistry } from './BlueprintRegistry';
import { PromptGenerator } from './PromptGenerator';
import { ToolExecutor } from './ToolExecutor';
import { useGameStore } from '../stores/gameStore';
import { player2Service } from '../services/player2';

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

export class GameEngine {
  private sceneModel: SceneModel | null = null;
  private promptGenerator: PromptGenerator;
  private toolExecutor: ToolExecutor;
  private conversationHistory: unknown[] = [];

  private playerInputCallback: ((resolve: (text: string) => void) => void) | null = null;
  private continueCallback: ((resolve: () => void) => void) | null = null;

  constructor(
    private registry: BlueprintRegistry,
    gameStore: typeof useGameStore,
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
    const gameStore = this.toolExecutor['gameStore'].getState();

    this.conversationHistory = [];

    // Find the first NPC character (not the player) as the active character
    const firstNPC = sceneBlueprint.characters.find((charId) => {
      const char = this.registry.getCharacter(charId);
      return char.role !== 'player';
    });

    if (!firstNPC) {
      throw new Error(`Scene ${sceneId} has no NPC characters`);
    }

    this.sceneModel = {
      blueprint: sceneBlueprint,
      characters: new Map(),
      activeCharacter: firstNPC,
    };

    for (const charId of sceneBlueprint.characters) {
      const charBlueprint = this.registry.getCharacter(charId);
      const goals = sceneBlueprint.goals.filter((g) => g.character_id === charId);
      this.sceneModel.characters.set(charId, {
        blueprint: charBlueprint,
        sceneGoals: goals,
      });
    }

    // Clear old objectives and add current scene objectives to dossier
    gameStore.clearObjectives();
    for (const goal of sceneBlueprint.goals) {
      const character = goal.character_id ? this.registry.getCharacter(goal.character_id) : null;
      const objectiveText = character ? `${character.name}: ${goal.description}` : goal.description;
      gameStore.updateDossier('objective', objectiveText);
    }

    this.onUpdate({ type: 'scene_loaded', scene: this.sceneModel });

    if (sceneBlueprint.intro) {
      await this.typewriteText(sceneBlueprint.intro);
      // Wait for player to press continue before starting conversation
      await this.waitForContinue();
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
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const playerInput = await this.waitForPlayerInput();

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

    const maxIterations = 5;
    for (let i = 0; i < maxIterations; i++) {
      const response = await player2Service.chatCompletion({
        messages,
        tools: this.toolExecutor.getToolDefinitions(),
        tool_choice: 'auto',
      });

      const aiMessage = response.choices[0].message;
      messages.push(aiMessage);

      if (!aiMessage.tool_calls) {
        this.conversationHistory = messages;
        return { text: aiMessage.content || '', ended: false };
      }

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

        if (result && typeof result === 'object' && 'terminal' in result && result.terminal) {
          this.conversationHistory = messages;
          return {
            text: aiMessage.content || '',
            ended: true,
            result: (result as { result?: string }).result,
            summary: (result as { summary?: string }).summary,
          };
        }
      }
    }

    this.conversationHistory = messages;
    const lastMessage = messages[messages.length - 1] as { content?: string };
    return { text: lastMessage.content || '', ended: false };
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

  private async endScene(result?: string, summary?: string): Promise<void> {
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
