/**
 * Player2 API Service
 * Manages authentication and API requests to Player2.gg
 */

const API_BASE = 'https://api.player2.game/v1';
const API_KEY_STORAGE_KEY = 'player2_api_key';

class Player2Service {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  }

  /**
   * Check if API key is set
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get current API key
   */
  getApiKey(): string | null {
    return this.apiKey;
  }

  /**
   * Set API key and save to localStorage
   */
  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  }

  /**
   * Clear API key from memory and localStorage
   */
  clearApiKey(): void {
    this.apiKey = null;
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }

  /**
   * Health check to validate API key
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('[Player2] Health check failed:', error);
      return false;
    }
  }

  /**
   * Make a chat completion request
   */
  async chatCompletion(params: {
    messages: unknown[];
    tools: unknown[];
    tool_choice: string;
  }): Promise<{
    choices: Array<{
      message: {
        role: string;
        content?: string;
        tool_calls?: Array<{
          id: string;
          function: {
            name: string;
            arguments: string;
          };
        }>;
        tool_call_id?: string;
      };
    }>;
  }> {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Singleton instance
export const player2Service = new Player2Service();
