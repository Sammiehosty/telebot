import React, { useState, useEffect } from 'react';
import { BotConfig } from '../types';
import { toast } from 'react-hot-toast';
// @ts-ignore
import confetti from 'canvas-confetti';
import { Send, Image, Smile, Paperclip, AlertCircle, Trash2, Clock, Users, AlertTriangle, Loader2, User, X } from 'lucide-react';
import { botApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface BroadcastProps {
  config: BotConfig;
}

const Broadcast: React.FC<BroadcastProps> = ({ config }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedBroadcast, setSelectedBroadcast] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const [histRes, subsRes] = await Promise.all([
        botApi.getBroadcastHistory(),
        botApi.getSubscribers()
      ]);
      setHistory(histRes.data);
      setActiveCount(subsRes.data.filter((s: any) => s.status === 'active').length);
    } catch (err) {
      console.error('Failed to fetch broadcast data');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

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

  const handleSend = async () => {
    if (!message.trim() && !selectedFile) return;
    
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('message', message);
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      const response = await botApi.sendBroadcast(formData);
      
      if (response.data.success) {
        setIsSending(false);
        setMessage('');
        clearFile();
        
        toast.success(`Broadcast Deployed to ${response.data.count} Nodes`);

        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#2dd4bf', '#6366f1']
        });

        fetchHistory();
      }
    } catch (err: any) {
      setIsSending(false);
      toast.error(err.response?.data?.message || 'Deployment Failed');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await botApi.deleteBroadcast(id);
      toast.success('Record Deleted');
      fetchHistory();
    } catch (err) {
      toast.error('Failed to delete record');
    }
    setDeleteId(null);
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Web3 Send Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-2xl shadow-blue-500/5 overflow-hidden">
        <div className="p-8 border-b border-slate-100/50 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-transparent">
          <div>
            <h2 className="font-black text-2xl tracking-tight text-slate-900">Broadcast Terminal</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Deploy global updates to all synchronized nodes.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
            <Users size={16} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-700">{activeCount.toLocaleString()} Active Nodes</span>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          {!config.token && (
            <div className="bg-red-50/50 backdrop-blur-sm border border-red-100 rounded-[1.5rem] p-6 flex items-start gap-4">
              <div className="bg-red-500 p-2 rounded-xl text-white shadow-lg shadow-red-200">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-900 uppercase tracking-wider">Protocol Halted</h4>
                <p className="text-xs font-medium text-red-700 mt-1 leading-relaxed">Bot Token signature missing. Synchronize your bot in settings to enable broadcast permissions.</p>
              </div>
            </div>
          )}

          <div className="group relative">
            {previewUrl && (
              <div className="mb-4 relative inline-block">
                {selectedFile?.type.startsWith('image') ? (
                  <img src={previewUrl} alt="Preview" className="max-h-48 rounded-2xl border border-slate-200" />
                ) : (
                  <video src={previewUrl} className="max-h-48 rounded-2xl border border-slate-200" controls />
                )}
                <button 
                  onClick={clearFile}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message for global distribution..."
              className="w-full min-h-[180px] p-6 bg-slate-50/50 border border-slate-200/60 rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none text-slate-700 font-medium placeholder:text-slate-400"
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-1">
              <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Smile size={20} /></button>
              <label className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer">
                <Paperclip size={20} />
                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
              </label>
              <label className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer">
                <Image size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Mainnet Distribution Enabled
            </div>
            
            <button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-[1.2rem] font-black tracking-tight transition-all duration-300 ${
                isSending 
                  ? 'bg-blue-100 text-blue-400 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-900/20'
              }`}
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Deploy Broadcast
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Web3 History Section - Rearranged to 2-Column Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <Clock className="text-slate-400" size={20} />
            <h2 className="font-black text-xl text-slate-900 tracking-tight uppercase">Deployment Ledger</h2>
          </div>
          <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
            {history.length} Transactions
          </div>
        </div>
        
        {isLoadingHistory ? (
          <div className="p-24 text-center bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-dashed border-slate-200">
            <Loader2 className="animate-spin w-10 h-10 text-wa-teal mx-auto" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">Reading Chain Data...</p>
          </div>
        ) : history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedBroadcast(item)}
                className="group relative bg-white rounded-[2rem] border border-slate-200/60 p-6 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-200/50 flex flex-col justify-between min-h-[160px] cursor-pointer"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                        TX
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                      Confirmed
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-700 line-clamp-3 leading-relaxed pr-6">
                    {item.message_text}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                          <User size={12} className="text-slate-400" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                      {item.target_count} Nodes Reached
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(item.id);
                    }}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Entry"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-24 text-center bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
              <Send className="text-slate-200" size={32} />
            </div>
            <h3 className="font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Ledger Empty</h3>
            <p className="text-xs font-bold text-slate-300 mt-2">Global distribution history will appear here</p>
          </div>
        )}
      </div>

      {/* Web3 Broadcast Content Modal */}
      <AnimatePresence>
        {selectedBroadcast && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBroadcast(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-8 bg-[#f0f2f5] border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <Send size={24} />
                  </div>
                  <div>
                    <h2 className="font-black text-xl text-slate-900 tracking-tight">Broadcast Detail</h2>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Transaction Log</p>
                  </div>
                </div>
                <button onClick={() => setSelectedBroadcast(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 max-h-[300px] overflow-y-auto">
                  <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedBroadcast.message_text}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Timestamp</span>
                    <p className="text-xs font-bold text-slate-700">
                      {new Date(selectedBroadcast.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Impact</span>
                    <p className="text-xs font-bold text-slate-700">
                      {selectedBroadcast.target_count} Active Nodes
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedBroadcast(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-blue-600 shadow-xl"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Web3 Delete Alert */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 shadow-2xl shadow-red-500/20">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase mb-2">Delete Record</h3>
              <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">
                You are about to permanently delete this broadcast record. This action cannot be reversed.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Broadcast;
