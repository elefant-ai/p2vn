/**
 * Player2 API Service
 * Manages authentication and API requests to Player2.gg
 */

const API_BASE = 'https://api.player2.game/v1';
const API_KEY_STORAGE_KEY = 'player2_api_key';

class Player2Service {
  private apiKey: string | null = null;
  private authMethod: 'cookie' | 'api_key' | null = null;

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
    this.authMethod = null;
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }

  /**
   * Get current authentication method
   */
  getAuthMethod(): 'cookie' | 'api_key' | null {
    return this.authMethod;
  }

  /**
   * Check if authenticated (either via cookie or API key)
   */
  isAuthenticated(): boolean {
    return this.authMethod !== null;
  }

  /**
   * Health check to validate authentication
   * First tries cookie-based auth, then falls back to API key if available
   */
  async healthCheck(): Promise<boolean> {
    // First try cookie-based authentication
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        this.authMethod = 'cookie';
        return true;
      }
    } catch (error) {
      console.warn('[Player2] Cookie auth failed:', error);
    }

    // If cookie auth failed, try API key if available
    if (this.apiKey) {
      try {
        const response = await fetch(`${API_BASE}/health`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          this.authMethod = 'api_key';
          return true;
        }
      } catch (error) {
        console.error('[Player2] API key auth failed:', error);
      }
    }

    // Reset auth method if both failed
    this.authMethod = null;
    return false;
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
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only include Authorization header if using API key auth
    if (this.authMethod === 'api_key' && this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.authMethod = null; // Reset auth on 401
        throw new Error('Authentication failed');
      }
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Singleton instance
export const player2Service = new Player2Service();
