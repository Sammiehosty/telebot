import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
// @ts-ignore
import confetti from 'canvas-confetti';
import { 
  LayoutDashboard, 
  Send, 
  Settings as SettingsIcon, 
  Users, 
  Lock, 
  Menu, 
  X, 
  Bot, 
  LogOut,
  MessageSquare
} from 'lucide-react';
import Sidebar, { NavItem } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Broadcast from './components/Broadcast';
import Settings from './components/Settings';
import Subscribers from './components/Subscribers';
import Messages from './components/Messages';
import { BotConfig } from './types';
import { botApi } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('is_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useState<BotConfig>({
    token: '',
    channelId: '',
    botName: 'Loading...',
    status: 'offline',
    welcomeMessage: '',
    successMessage: '',
    noMessage: '',
    channelLink: '',
    adminTelegramId: ''
  });
  const [apiError, setApiError] = useState(false);

  // Load config from MySQL on startup
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await botApi.getConfig();
        const data = response.data;
        if (data) {
          setConfig({
            token: data.bot_token || '',
            channelId: data.channel_id || '',
            botName: data.bot_name || 'TeleBot Manager',
            status: data.status || 'offline',
            welcomeMessage: data.welcome_message || '',
            successMessage: data.success_message || '',
            noMessage: data.no_message || '',
            channelLink: data.channel_link || '',
            successLink: data.success_link || '',
            adminTelegramId: data.admin_telegram_id || ''
          });
          setApiError(false);
        }
      } catch (err) {
        console.error('Failed to load remote config');
        setApiError(true);
      }
    };
    
    if (isAuthenticated) {
      loadConfig();
      const interval = setInterval(loadConfig, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (apiError && isAuthenticated) {
      toast.error('API Connection Lost', { id: 'api-error', style: { background: '#1e293b', color: '#fff' } });
    }
  }, [apiError, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const tId = toast.loading('Authenticating...');
    try {
      const response = await botApi.login(password);
      if (response.data.success) {
        toast.success('Access Verified', { id: tId });
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setIsAuthenticated(true);
        sessionStorage.setItem('is_auth', 'true');
        setError('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Server connection failed';
      toast.error(`Denied: ${msg}`, { id: tId });
      setError(msg);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('is_auth');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard config={config} />;
      case 'broadcast': return <Broadcast config={config} />;
      case 'inbox': return <Messages />;
      case 'subscribers': return <Subscribers config={config} />;
      case 'settings': return <Settings config={config} setConfig={setConfig} />;
      default: return <Dashboard config={config} />;
    }
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'broadcast', label: 'Broadcast', icon: Send },
    { id: 'inbox', label: 'Inbox', icon: MessageSquare },
    { id: 'subscribers', label: 'Subscribers', icon: Users },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="glass-dark rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-10 flex flex-col items-center">
              <div className="bg-blue-600/20 p-5 rounded-3xl mb-6 shadow-2xl shadow-blue-500/20">
                <Bot size={56} className="text-blue-500 animate-float" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase">TeleNode</h1>
              <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-2">Protocol Access</p>
            </div>
            <form onSubmit={handleLogin} className="p-10 pt-0 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Hash</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/10 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-white font-bold"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-[10px] font-black uppercase text-center tracking-widest animate-pulse">{error}</p>}
              <button
                type="submit"
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 active:scale-95"
              >
                Connect
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#dadbd3] text-[#111b21] font-sans overflow-hidden">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#fff',
            borderRadius: '1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            padding: '1rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '700',
            letterSpacing: '0.025em',
            textTransform: 'uppercase',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }
          }
        }}
      />
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-all duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar items={navItems} activeTab={activeTab} setActiveTab={(id) => { setActiveTab(id); setIsSidebarOpen(false); }} botName={config.botName} />
      </div>
      
      <main className="flex-1 flex flex-col min-w-0 bg-[#f0f2f5]">
        <header className="h-24 flex items-center justify-between px-6 lg:px-12 flex-shrink-0 bg-[#f0f2f5] border-b border-[#d1d7db]">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-[#54656f]">
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <h2 className="text-xl font-bold capitalize tracking-tight">{activeTab}</h2>
              <p className="text-[11px] text-[#667781] font-medium uppercase tracking-wider">TeleBot Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border ${config.status === 'online' ? 'bg-[#25d366]/10 text-[#00a884] border-[#25d366]/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
              <div className={`w-2 h-2 rounded-full ${config.status === 'online' ? 'bg-[#25d366]' : 'bg-red-500'}`} />
              Bot {config.status === 'online' ? 'Active' : 'Offline'}
            </div>
            <div className={`hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${apiError ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${apiError ? 'bg-red-500' : 'bg-blue-500'}`} />
              API {apiError ? 'Offline' : 'Connected'}
            </div>
            <div className="w-px h-6 bg-[#d1d7db] mx-2 hidden md:block" />
            <button onClick={handleLogout} className="p-2.5 text-[#54656f] hover:bg-[#e9edef] rounded-full transition-all">
              <LogOut size={22} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-0 relative">
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] wa-bg-pattern" />
          <div className="relative z-10 p-6 lg:p-10">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
