export interface LLMAdapter {
  chat(messages: { role: string; content: string }[], options?: { temperature?: number; jsonMode?: boolean }): Promise<string>;
}

export function createLLMAdapter(config: any): LLMAdapter {
  const { provider, api_key, model, base_url } = config;
  
  switch (provider) {
    case 'deepseek':
      return new DeepSeekAdapter(api_key, model, base_url);
    case 'openai':
      return new OpenAIAdapter(api_key, model, base_url);
    // Add others as needed
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

class DeepSeekAdapter implements LLMAdapter {
  constructor(
    private apiKey: string, 
    private model: string, 
    private baseUrl: string = 'https://api.deepseek.com/chat/completions'
  ) {}

  async chat(messages: { role: string; content: string }[], options?: { temperature?: number; jsonMode?: boolean }): Promise<string> {
    const body: any = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.5,
    };
    if (options?.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    let res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok && options?.jsonMode) {
      delete body.response_format;
      res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      throw new Error(`DeepSeek HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }
}

class OpenAIAdapter implements LLMAdapter {
  constructor(
    private apiKey: string, 
    private model: string, 
    private baseUrl: string = 'https://api.openai.com/v1/chat/completions'
  ) {}

  async chat(messages: { role: string; content: string }[], options?: { temperature?: number; jsonMode?: boolean }): Promise<string> {
    const body: any = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.5,
    };
    if (options?.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`OpenAI HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }
}
