
interface AIResponse {
  success: boolean;
  content: string;
  error?: string;
}

interface AIServiceConfig {
  provider: 'openai' | 'ollama';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

class AINotesService {
  private config: AIServiceConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini'
  };

  setConfig(config: Partial<AIServiceConfig>) {
    this.config = { ...this.config, ...config };
  }

  async summarizeNote(content: string): Promise<AIResponse> {
    return this.makeRequest(
      `Please summarize the following note in 2-3 sentences:\n\n${content}`,
      'summarize'
    );
  }

  async rephraseForClarity(content: string): Promise<AIResponse> {
    return this.makeRequest(
      `Please rephrase the following note for better clarity and readability:\n\n${content}`,
      'rephrase'
    );
  }

  async convertToTodos(content: string): Promise<AIResponse> {
    return this.makeRequest(
      `Convert the following note into a clear list of actionable TODO items. Format as a bulleted list:\n\n${content}`,
      'convert-todos'
    );
  }

  async generateFromVoice(transcript: string): Promise<AIResponse> {
    return this.makeRequest(
      `Convert this voice transcript into a well-formatted note:\n\n${transcript}`,
      'voice-to-note'
    );
  }

  private async makeRequest(prompt: string, action: string): Promise<AIResponse> {
    try {
      if (this.config.provider === 'openai') {
        return await this.makeOpenAIRequest(prompt);
      } else if (this.config.provider === 'ollama') {
        return await this.makeOllamaRequest(prompt);
      }
      
      throw new Error('No AI provider configured');
    } catch (error) {
      console.error(`AI ${action} error:`, error);
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async makeOpenAIRequest(prompt: string): Promise<AIResponse> {
    const apiKey = this.config.apiKey || localStorage.getItem('openai-api-key');
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please set it in settings.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that helps improve and organize notes. Be concise and clear.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      content: data.choices[0]?.message?.content || 'No response generated'
    };
  }

  private async makeOllamaRequest(prompt: string): Promise<AIResponse> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    const model = this.config.model || 'llama2';

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      content: data.response || 'No response generated'
    };
  }
}

export const aiNotesService = new AINotesService();
