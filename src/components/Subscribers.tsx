import React, { useState } from 'react';
import { BotConfig } from '../types';
import { Search, User, Loader2, X, Shield, Calendar, Hash, AtSign, AlertTriangle } from 'lucide-react';
import { botApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface SubscribersProps {
  config: BotConfig;
}

const Subscribers: React.FC<SubscribersProps> = () => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchSubscribers = async () => {
    try {
      const response = await botApi.getSubscribers();
      setSubscribers(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch subscribers');
    }
  };

  React.useEffect(() => {
    fetchSubscribers();
    const interval = setInterval(fetchSubscribers, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleStatus = async (id: number) => {
    const sub = subscribers.find(s => s.id === id);
    if (!sub) return;
    const newStatus = sub.status === 'active' ? 'blocked' : 'active';
    try {
      await botApi.updateSubscriberStatus(id, newStatus);
      fetchSubscribers();
    } catch (err) {
      console.error('Failed to update status');
    }
  };

  const deleteSubscriber = async (id: number) => {
    try {
      // In a real app, you'd call a delete API
      setSubscribers(subscribers.filter(s => s.id !== id));
      toast.success('Node Deleted from Registry');
    } catch (err) {
      toast.error('Delete Failed');
    }
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10">
        <Loader2 className="animate-spin text-wa-teal" size={32} />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-slate-200/10 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="p-8 border-b border-slate-100/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-slate-50/50 to-transparent">
          <div>
            <h2 className="font-black text-2xl text-slate-900 tracking-tight">Network Nodes</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Validated Network Participants</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search nodes..."
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 focus:border-wa-teal focus:ring-8 focus:ring-wa-teal/5 rounded-[1.25rem] text-sm font-bold outline-none transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Node Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => setSelectedSub(sub)}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200/50 shadow-inner group-hover:scale-110 transition-transform">
                        <User size={20} />
                      </div>
                      <div>
                        <span className="font-black text-sm block text-slate-900 tracking-tight">{sub.first_name} {sub.last_name}</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{sub.username ? `@${sub.username}` : 'No alias'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      sub.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {sub.status === 'active' ? '● Active' : '● Restricted'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleStatus(sub.id); }}
                      className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${
                        sub.status === 'active' 
                          ? 'border-amber-200 text-amber-600 hover:bg-amber-600 hover:text-white' 
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      {sub.status === 'active' ? 'Block' : 'Unblock'}
                    </button>
                  </td>
                </tr>
              ))}
              {subscribers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-24 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                      <User className="text-slate-300" size={32} />
                    </div>
                    <h3 className="font-black text-slate-400 uppercase tracking-[0.2em]">Registry Empty</h3>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-8 border-t border-slate-100/50 bg-slate-50/20">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {subscribers.length} synchronized nodes
          </span>
        </div>
      </div>

      {/* Subscriber Detail Modal */}
      <AnimatePresence>
        {selectedSub && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSub(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-8 bg-[#f0f2f5] border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-wa-teal text-white flex items-center justify-center shadow-lg shadow-wa-teal/20">
                    <User size={32} />
                  </div>
                  <div>
                    <h2 className="font-black text-xl text-slate-900 tracking-tight">{selectedSub.first_name} {selectedSub.last_name}</h2>
                    <p className="text-xs font-bold text-wa-teal uppercase tracking-widest">Subscriber Profile</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSub(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <Hash size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Telegram ID</span>
                    </div>
                    <p className="font-mono text-sm font-bold text-slate-700">{selectedSub.telegram_id}</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <AtSign size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Alias</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{selectedSub.username ? `@${selectedSub.username}` : 'N/A'}</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <Calendar size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Joined On</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{new Date(selectedSub.joined_at).toLocaleDateString()}</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <Shield size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Status</span>
                    </div>
                    <p className={`text-sm font-black uppercase tracking-tighter ${selectedSub.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {selectedSub.status}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-4">
                  <button 
                    onClick={() => { toggleStatus(selectedSub.id); setSelectedSub(null); }}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                      selectedSub.status === 'active' 
                        ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20' 
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    {selectedSub.status === 'active' ? 'Restrict Node' : 'Verify Node'}
                  </button>
                  <button 
                    onClick={() => { setDeleteId(selectedSub.id); }}
                    className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                  >
                    Delete Record
                  </button>
                </div>
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
              <h3 className="text-xl font-black text-white tracking-tight uppercase mb-2">Destructive Action</h3>
              <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">
                You are about to delete this node from the registry. This transaction cannot be reversed on the ledger.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteSubscriber(deleteId)}
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

export default Subscribers;
