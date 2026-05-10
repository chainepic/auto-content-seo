export interface ImageAdapter {
  generatePrompt(title: string, content: string): Promise<string>;
  generateImage(prompt: string): Promise<string>; // returns image URL
}

export function createImageAdapter(config: any, llmConfig: any): ImageAdapter | null {
  if (!config || !config.provider) return null;

  switch (config.provider) {
    case 'wanx':
      return new WanxAdapter(config.api_key);
    default:
      throw new Error(`Unsupported Image provider: ${config.provider}`);
  }
}

class WanxAdapter implements ImageAdapter {
  constructor(private apiKey: string) {}

  async generatePrompt(title: string, content: string): Promise<string> {
    const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: `Generate a SINGLE detailed image prompt in English for a text-to-image AI model. 
Requirements:
- NO text or letters in the image
- Professional photography or artistic style
- Match the theme of the article
- Keep it under 200 words
Output ONLY the prompt text, nothing else.`,
          },
          {
            role: 'user',
            content: `Article title: ${title}\n\nContent preview: ${content.substring(0, 1500)}`,
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Qwen prompt: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content.trim();
  }

  async generateImage(prompt: string): Promise<string> {
    const res = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      {
        method: 'POST',
        headers: {
          'X-DashScope-Async': 'enable',
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'wanx2.1-t2i-turbo',
          input: { prompt },
          parameters: { size: '1024*576', n: 1 },
        }),
      },
    );

    if (!res.ok) throw new Error(`Wanx submit: ${await res.text()}`);
    const js = await res.json();
    const taskId = js.output?.task_id;
    if (!taskId) throw new Error(`Wanx: no task_id ${JSON.stringify(js)}`);

    let status = 'PENDING';
    let imageUrl: string | null = null;
    while (status === 'PENDING' || status === 'RUNNING') {
      await new Promise(r => setTimeout(r, 3000));
      const poll = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!poll.ok) throw new Error(`Wanx poll: ${await poll.text()}`);
      const p = await poll.json();
      status = p.output?.task_status;
      if (status === 'SUCCEEDED') imageUrl = p.output?.results?.[0]?.url;
      else if (status === 'FAILED') throw new Error(`Wanx failed: ${JSON.stringify(p.output)}`);
    }
    return imageUrl!;
  }
}
