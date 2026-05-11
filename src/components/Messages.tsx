import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, User, MessageSquare, Loader2, RefreshCcw, Smile, Paperclip, X, ArrowLeft } from 'lucide-react';
import { botApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const response = await botApi.getConversations();
      setConversations(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch conversations');
    }
  };

  const fetchHistory = async (telegramId: string) => {
    try {
      const response = await botApi.getMessageHistory(telegramId);
      setMessages(response.data);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to fetch history');
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchHistory(selectedUser.telegram_id);
      const interval = setInterval(() => fetchHistory(selectedUser.telegram_id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!reply.trim() && !selectedFile) || !selectedUser) return;

    setSending(true);
    try {
      const formData = new FormData();
      // Append non-file fields first
      formData.append('telegram_id', selectedUser.telegram_id);
      formData.append('message_text', reply);
      
      // Append file last
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      const response = await botApi.replyToUser(formData);
      
      if (response.data.success) {
        setReply('');
        clearFile();
        fetchHistory(selectedUser.telegram_id);
        toast.success('Response Deployed');
      } else {
        throw new Error(response.data.message || 'Transmission failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Node Transmission Failed';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <Loader2 className="animate-spin text-wa-teal" size={40} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-14rem)] bg-white border border-[#d1d7db] shadow-sm overflow-hidden relative rounded-xl">
      {/* Sidebar: Conversations List */}
      <div className="w-full h-full flex flex-col">
        <div className="p-4 bg-[#f0f2f5] flex justify-between items-center border-b border-[#d1d7db]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center text-[#54656f]">
                <User size={24} />
             </div>
             <span className="font-bold text-[#111b21]">Chats</span>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={async () => {
                const tId = toast.loading('Syncing...', { style: { background: '#111b21', color: '#fff' } });
                try {
                  const res = await botApi.syncPastMessages();
                  toast.success(`Synced ${res.data.synced}`, { id: tId });
                  fetchConversations();
                } catch(e) { toast.error('Sync failed', { id: tId }); }
              }} 
              className="p-2 hover:bg-[#d1d7db] rounded-full transition-colors text-[#54656f]"
              title="Sync past messages"
            >
              <RefreshCcw size={20} />
            </button>
            <button onClick={fetchConversations} className="p-2 hover:bg-[#d1d7db] rounded-full transition-colors text-[#54656f]">
              <MessageSquare size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-3 bg-white border-b border-[#f6f6f6]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#54656f]" size={16} />
            <input
              type="text"
              placeholder="Search or start new chat"
              className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] rounded-lg text-sm focus:outline-none placeholder:text-[#667781]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5]">
          {conversations.map((conv) => (
            <button
              key={conv.telegram_id}
              onClick={() => setSelectedUser(conv)}
              className={`w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-[#f5f6f6] ${
                selectedUser?.telegram_id === conv.telegram_id ? 'bg-[#f0f2f5]' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-[#dfe5e7] flex items-center justify-center shrink-0">
                <User size={24} className="text-[#54656f]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <span className="font-bold text-[#111b21] truncate">{conv.first_name}</span>
                  <span className="text-[11px] text-[#667781] whitespace-nowrap mt-1">
                    {conv.created_at ? new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className={`text-sm truncate ${!conv.is_read && conv.direction === 'inbound' ? 'font-bold text-[#111b21]' : 'text-[#667781]'}`}>
                  {conv.direction === 'outbound' && <span className="opacity-70">You: </span>}
                  {conv.message_text || <span className="italic opacity-60">No messages yet. Click to start chat.</span>}
                </p>
              </div>
              {!conv.is_read && conv.direction === 'inbound' && (
                <div className="w-3 h-3 bg-[#25d366] rounded-full self-center mt-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Popup / Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 bg-white flex flex-col"
          >
            <div className="p-3 bg-[#f0f2f5] border-b border-[#d1d7db] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-[#d1d7db] rounded-full transition-colors text-[#54656f]"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center text-white overflow-hidden">
                  <User size={28} className="text-[#54656f]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#111b21]">{selectedUser.first_name}</h3>
                  <p className="text-[11px] text-[#00a884] font-medium tracking-tight">online</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-[#d1d7db] rounded-full transition-colors text-[#54656f]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-2 wa-bg-pattern relative">
              <div className="absolute inset-0 bg-[#e5ddd5] opacity-30 pointer-events-none" />
              <div className="relative z-10 flex flex-col space-y-2">
                {messages.map((msg) => {
                  const isUser = msg.direction === 'inbound';
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                      <div className={isUser ? 'chat-bubble-in' : 'chat-bubble-out'}>
                        {msg.media_url && (
                          <div className="mb-2 max-w-full overflow-hidden rounded-md">
                            {msg.media_type === 'image' ? (
                              <img src={`https://fundstube.sammiehost.com${msg.media_url}`} alt="Media" className="w-full object-cover" />
                            ) : (
                              <video src={`https://fundstube.sammiehost.com${msg.media_url}`} className="w-full" controls />
                            )}
                          </div>
                        )}
                        <p className="leading-tight">{msg.message_text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[6px] opacity-60">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!isUser && (
                            <div className="flex text-[#34b7f1]">
                              <svg viewBox="0 0 16 11" width="16" height="11" fill="currentColor"><path d="M15.01 3.316l-.478-.372a.365.365 0 00-.51.063L8.666 9.88a.32.32 0 01-.484.032l-.358-.325a.32.32 0 00-.484.032l-.378.48a.418.318 0 00.036.525l1.623 1.472a.32.32 0 00.484-.032l6.95-9.32a.366.366 0 00-.063-.526zm-4.969 0l-.478-.372a.365.365 0 00-.51.063L4.2 9.88a.32.32 0 01-.484.032l-.358-.325a.32.32 0 00-.484.032l-.378.48a.418.318 0 00.036.525l1.623 1.472a.32.32 0 00.484-.032l6.95-9.32a.366.366 0 00-.063-.526zM1.052 6.337l-.478-.372a.365.365 0 00-.51.063L.012 6.082a.366.366 0 00.063.526l1.623 1.472a.32.32 0 00.484-.032l.378-.48a.32.32 0 00-.036-.525l-.358-.325a.32.32 0 01-.114-.372z"></path></svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-3 bg-[#f0f2f5] flex flex-col gap-2 relative z-10">
              {previewUrl && (
                <div className="mx-4 relative inline-block self-start">
                  {selectedFile?.type.startsWith('image') ? (
                    <img src={previewUrl} alt="Preview" className="max-h-32 rounded-lg border border-[#d1d7db]" />
                  ) : (
                    <video src={previewUrl} className="max-h-32 rounded-lg border border-[#d1d7db]" controls />
                  )}
                  <button 
                    onClick={clearFile}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
               
                <label className="p-2 text-[#54656f] hover:bg-[#d1d7db] rounded-full transition-colors cursor-pointer">
                  <Paperclip size={12} />
                  <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                </label>
                <form onSubmit={handleSend} className="flex-1 flex gap-3">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type a message"
                    className="flex-1 px-2 py-2 bg-white border-none rounded-lg text-sm focus:outline-none shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={sending || (!reply.trim() && !selectedFile)}
                    className="p-3 bg-wa-teal text-white hover:bg-wa-green rounded-full transition-all shadow-md active:scale-95"
                  >
                    {sending ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messages;
