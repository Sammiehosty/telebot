export interface BotConfig {
  id?: number;
  token: string;
  channelId: string;
  botName: string;
  status: 'online' | 'offline';
  adminPassword?: string;
  webhookUrl?: string;
  welcomeMessage?: string;
  successMessage?: string;
  noMessage?: string;
  channelLink?: string;
  successLink?: string;
  adminTelegramId?: string;
}

export interface Subscriber {
  id: number;
  telegram_id: string;
  username?: string;
  firstName: string;
  lastName?: string;
  joinedAt: string;
  status: 'active' | 'blocked';
}

export interface AppUser {
  id: number;
  username: string;
  role: 'admin' | 'moderator';
  lastLogin: string;
}

export interface BroadcastMessage {
  id: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'pending';
  targetCount: number;
}
