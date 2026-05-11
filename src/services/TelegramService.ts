import axios from 'axios';

const BASE_URL = 'https://api.telegram.org/bot';

export class TelegramService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async getMe() {
    try {
      const response = await axios.get(`${BASE_URL}${this.token}/getMe`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bot info:', error);
      throw error;
    }
  }

  async sendMessage(chatId: string | number, text: string) {
    try {
      const response = await axios.post(`${BASE_URL}${this.token}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getUpdates(offset?: number) {
    try {
      const response = await axios.get(`${BASE_URL}${this.token}/getUpdates`, {
        params: { offset, limit: 100 }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching updates:', error);
      throw error;
    }
  }

  // Helper to set webhook (usually done once)
  async setWebhook(url: string) {
    try {
      const response = await axios.post(`${BASE_URL}${this.token}/setWebhook`, {
        url: url
      });
      return response.data;
    } catch (error) {
      console.error('Error setting webhook:', error);
      throw error;
    }
  }
}
