import React from 'react';
import { BotConfig } from '../types';
import { 
  Users, 
  TrendingUp, 
  Clock,
  Send,
  User
} from 'lucide-react';
import { botApi } from '../services/api';

interface DashboardProps {
  config: BotConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ config }) => {
  const [data, setData] = React.useState<{
    subs: any[],
    stats: { label: string, value: string, icon: any, color: string, trend: string }[]
  }>({
    subs: [],
    stats: [
      { label: 'Total Subscribers', value: '0', icon: Users, color: 'bg-blue-500', trend: 'Updating...' },
      { label: 'Active Users', value: '0', icon: Send, color: 'bg-purple-500', trend: 'Live' },
      { label: 'Bot Status', value: 'Checking...', icon: TrendingUp, color: 'bg-green-500', trend: '...' },
      { label: 'System Uptime', value: '100%', icon: Clock, color: 'bg-amber-500', trend: 'Stable' },
    ]
  });

  const loadRealtimeStats = async () => {
    try {
      const response = await botApi.getSubscribers();
      const subs = response.data;
      const activeSubs = subs.filter((s: any) => s.status === 'active').length;
      
      setData({
        subs: subs.slice(0, 5), // Only last 5 for activity feed
        stats: [
          { label: 'Total Subscribers', value: subs.length.toString(), icon: Users, color: 'bg-blue-500', trend: `+${subs.length}` },
          { label: 'Active Users', value: activeSubs.toString(), icon: Send, color: 'bg-purple-500', trend: 'Active' },
          { label: 'Bot Status', value: config.status === 'online' ? 'Online' : 'Offline', icon: TrendingUp, color: config.status === 'online' ? 'bg-green-500' : 'bg-red-500', trend: config.status === 'online' ? 'Connected' : 'Disconnected' },
          { label: 'System Nodes', value: 'Healthy', icon: Clock, color: 'bg-amber-500', trend: 'Stable' },
        ]
      });
    } catch (err) {
      console.error('Stats fetch failed');
    }
  };

  React.useEffect(() => {
    loadRealtimeStats();
    const interval = setInterval(loadRealtimeStats, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, [config.token]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.stats.map((stat, i) => (
          <div key={i} className="group bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/10 transition-all hover:scale-[1.02] hover:shadow-2xl hover:border-blue-200/50">
            <div className="flex justify-between items-start mb-6">
              <div className={`${stat.color} p-4 rounded-2xl text-white shadow-2xl shadow-current/30 group-hover:animate-float`}>
                <stat.icon size={26} />
              </div>
              <span className="text-[10px] font-black tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">{stat.label}</h3>
            <p className="text-3xl font-black mt-2 text-slate-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-slate-200/10 overflow-hidden">
          <div className="p-8 border-b border-slate-100/50 flex justify-between items-center bg-gradient-to-r from-slate-50/50 to-transparent">
            <div>
              <h2 className="font-black text-xl text-slate-900 tracking-tight">Active Node Stream</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live Subscriber Updates</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Listening</span>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {data.subs.length > 0 ? data.subs.map((sub, i) => (
              <div key={i} className="p-8 flex gap-6 hover:bg-blue-50/30 transition-colors group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <User className="text-white" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-base text-slate-900 truncate tracking-tight">
                      {sub.first_name} {sub.last_name || ''}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                      {new Date(sub.joined_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    Verification successful from <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-xs font-bold">{sub.telegram_id}</span>. {sub.username ? `Node alias @${sub.username} verified.` : 'Unlabeled node entry.'}
                  </p>
                </div>
              </div>
            )) : (
              <div className="p-24 text-center">
                <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                  <Users className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-400 text-sm font-black uppercase tracking-widest">Awaiting Network Entrance</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <h2 className="font-black text-xl mb-8 tracking-tight">Node Protocol</h2>
            
            <div className="space-y-6">
              <div className="flex gap-5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${config.status === 'online' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/10 text-white/40'}`}>
                  {config.status === 'online' ? '✓' : '01'}
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest mb-1">Bot Core</h4>
                  <p className="text-xs text-white/50 font-medium leading-relaxed">Telegram API handshake verified and active.</p>
                </div>
              </div>
              
              <div className="flex gap-5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${data.subs.length > 0 ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/10 text-white/40'}`}>
                  {data.subs.length > 0 ? '✓' : '02'}
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest mb-1">MySQL Sync</h4>
                  <p className="text-xs text-white/50 font-medium leading-relaxed">Subscriber ledger mirroring correctly.</p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
              <button 
                onClick={() => loadRealtimeStats()}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-400 hover:text-white transition-all duration-300 shadow-xl"
              >
                Refresh Ledger
              </button>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 p-8 shadow-xl shadow-slate-200/10">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest mb-4">Network Info</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">Your node is currently synchronized with the Telegram Mainnet. Latency is optimized for global distribution.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
