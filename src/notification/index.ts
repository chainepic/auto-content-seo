import { Telegraf } from 'telegraf';

export interface NotificationService {
  send(message: string): Promise<void>;
}

export function createNotifier(config: any): NotificationService {
  return new MultiNotifier(config);
}

class MultiNotifier implements NotificationService {
  private notifiers: NotificationService[] = [];

  constructor(config: any) {
    if (config?.telegram?.enabled && config.telegram.bot_token) {
      this.notifiers.push(new TelegramNotifier(config.telegram.bot_token, config.telegram.chat_id));
    }
    if (config?.discord?.enabled && config.discord.webhook_url) {
      this.notifiers.push(new DiscordNotifier(config.discord.webhook_url));
    }
  }

  async send(message: string): Promise<void> {
    for (const n of this.notifiers) {
      try {
        await n.send(message);
      } catch (e: any) {
        console.error(`Notifier failed: ${e.message}`);
      }
    }
  }
}

class TelegramNotifier implements NotificationService {
  private bot: Telegraf;
  constructor(token: string, private chatId: string) {
    this.bot = new Telegraf(token);
  }

  async send(message: string): Promise<void> {
    await this.bot.telegram.sendMessage(this.chatId, message, { parse_mode: 'HTML' });
  }
}

class DiscordNotifier implements NotificationService {
  constructor(private webhookUrl: string) {}

  async send(message: string): Promise<void> {
    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    });
  }
}
