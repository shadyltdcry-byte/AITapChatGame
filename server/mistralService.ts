
// Use native fetch (available in Node.js 18+)

interface MistralConfig {
  apiKey: string;
  model: string;
  debugModel: string;
}

interface DebugRequest {
  code: string;
  error: string;
  context?: string;
}

interface ChatRequest {
  message: string;
  characterId: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  characterPersonality?: string;
}

class MistralService {
  private config: MistralConfig;
  private enabled: boolean = false;

  constructor() {
    this.config = {
      apiKey: process.env.MISTRAL_API_KEY || '',
      model: 'ft:open-mistral-7b:0834440f:20250812:43c81adb', // Your custom trained model for character chat
      debugModel: 'ft:ministral-3b-latest:0834440f:20250812:63a294f4' // Updated debugging model
    };
    // Auto-enable when API key is available
    this.enabled = !!this.config.apiKey;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled && !!this.config.apiKey;
  }

  async debugAssist(request: DebugRequest): Promise<string> {
    if (!this.isEnabled()) {
      return 'MistralAI debug assistant is not enabled or configured.';
    }

    const prompt = `You are a helpful debugging assistant for a TypeScript/React game application.

Code with issue:
\`\`\`
${request.code}
\`\`\`

Error message:
${request.error}

${request.context ? `Additional context: ${request.context}` : ''}

Please provide:
1. An explanation of what's causing the error
2. A specific fix for the code
3. Best practices to prevent similar issues

Keep your response concise and actionable.`;

    try {
      const response = await this.callMistralAPI(prompt, this.config.debugModel);
      return response;
    } catch (error: any) {
      console.error('Mistral debug assist error:', error);
      return 'Unable to get debug assistance at this time.';
    }
  }

  async generateChatResponse(request: ChatRequest): Promise<string> {
    if (!this.isEnabled()) {
      return 'I understand! Thanks for talking with me.'; // Fallback response
    }

    const historyContext = request.conversationHistory && request.conversationHistory.length > 0
      ? request.conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      : '';

    const prompt = `You are roleplaying as a character in an anime-style game. 

Character personality: ${request.characterPersonality || 'friendly and engaging'}

${historyContext ? `Previous conversation:\n${historyContext}\n` : ''}User: ${request.message}

Respond naturally as the character. Keep it conversational and engaging. Do not repeat previous responses or greetings unless it's the very first message of the conversation. Limit response to 1-2 sentences.`;

    try {
      const response = await this.callMistralAPI(prompt, this.config.model);
      return response.trim();
    } catch (error: any) {
      console.error('Mistral chat error:', error);
      return 'I understand! Thanks for talking with me.'; // Fallback
    }
  }

  private async callMistralAPI(prompt: string, model: string): Promise<string> {
    try {
      console.log('Making Mistral API call to:', 'https://api.mistral.ai/v1/chat/completions');
      console.log('Using model:', model);
      
      const requestBody = {
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      };

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Mistral API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Mistral API error response:', errorText);
        throw new Error(`Mistral API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as any;
      console.log('Mistral API response data:', data);
      return data.choices[0]?.message?.content || 'No response generated.';
    } catch (error: any) {
      console.error('Mistral API call error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.apiKey) {
      return { success: false, message: 'API key not configured' };
    }

    try {
      const response = await this.callMistralAPI('Hello, this is a test.', this.config.model);
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }
}

export const mistralService = new MistralService();
