import axios from 'axios';

// Final Production API URL
// We use the root URL because the backend handles both / and /api
const API_BASE_URL = 'https://fundstube.sammiehost.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const botApi = {
  // Auth
  login: (password: string) => api.post('/api/login', { username: 'admin', password }),
  
  // Subscribers
  getSubscribers: () => api.get('/api/subscribers'),
  updateSubscriberStatus: (id: number, status: string) => api.put(`/api/subscribers/${id}`, { status }),
  
  // Broadcast
  sendBroadcast: (data: FormData) => api.post('/api/broadcast', data),
  getBroadcastHistory: () => api.get('/api/broadcast/history'),
  deleteBroadcast: (id: number) => api.delete(`/api/broadcast/${id}`),
  syncPastMessages: () => api.get('/api/sync/telegram'),
  
  // Config
  getConfig: () => api.get('/api/config'), 
  updateConfig: (data: any) => api.post('/api/config', data),
  
  // System Users
  getUsers: () => api.get('/users'),
  addUser: (user: any) => api.post('/users', user),
  deleteUser: (id: number) => api.delete(`/users/${id}`),
  updateAdminPassword: (adminId: number, newPassword: string) => api.put('/admin/password', { adminId, newPassword }),
  
  // Conversations
  getConversations: () => api.get('/conversations'),
  getMessageHistory: (telegramId: string) => api.get(`/messages/${telegramId}`),
  replyToUser: (data: FormData) => api.post('/messages/reply', data),
  
  // Push Notifications
  savePushSubscription: (subscription: any) => api.post('/push/subscribe', subscription),
  removePushSubscription: (endpoint: string) => api.post('/push/unsubscribe', { endpoint }),
};

export default api;
