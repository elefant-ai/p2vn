import { BlueprintRegistry } from './BlueprintRegistry';
import { useGameStore } from '../stores/gameStore';

export class ToolExecutor {
  constructor(
    private registry: BlueprintRegistry,
    private gameStore: typeof useGameStore
  ) {}

  private getState(keys: string[]): Record<string, unknown> {
    const state = this.gameStore.getState();
    return keys.reduce(
      (acc, key) => {
        const parts = key.split('.');
        let value: unknown = state;
        for (const part of parts) {
          value = value?.[part as keyof typeof value];
          if (value === undefined) break;
        }
        acc[key] = value;
        return acc;
      },
      {} as Record<string, unknown>
    );
  }

  execute(toolName: string, args: Record<string, unknown>): unknown {
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

        case 'player2_transfer_item': {
          const item = this.registry.getItem(args.item_id as string);
          if (!item) {
            return { success: false, error: `Item ${args.item_id} not found` };
          }

          const receiverId = args.receiver_id as string;
          const game = this.registry.getGame();

          if (receiverId === game.player_character_id) {
            this.gameStore.getState().addItem(item);
            return { success: true, item_transferred: item.name };
          }

          return { success: false, error: 'Only transfers to player are supported' };
        }

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
      console.error(`Error executing tool ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  getToolDefinitions(): unknown[] {
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
