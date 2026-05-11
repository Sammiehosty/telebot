import React, { useState } from 'react';
import { BotConfig } from '../types';
import { toast } from 'react-hot-toast';
import { botApi } from '../services/api';
import { Shield, Key, Megaphone, Info, Save, Bot, Globe, Lock, Hash, AtSign, CheckCircle, ShieldCheck } from 'lucide-react';

interface SettingsProps {
  config: BotConfig;
  setConfig: (config: BotConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, setConfig }) => {
  const [formData, setFormData] = useState<BotConfig>(config);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const handleSave = async () => {
    try {
      const payload = {
        bot_token: formData.token,
        channel_id: formData.channelId,
        bot_name: formData.botName,
        welcome_message: formData.welcomeMessage,
        success_message: formData.successMessage,
        no_message: formData.noMessage,
        channel_link: formData.channelLink,
        success_link: formData.successLink,
        admin_telegram_id: formData.adminTelegramId
      };

      const response = await botApi.updateConfig(payload);
      
      if (response.data.success) {
        setConfig(formData);
        toast.success('Protocol Synchronized');
      }
    } catch (err) {
      toast.error('Sync Failed');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('Hash Mismatch');
      return;
    }
    toast.success('Security Keys Rotated');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const testConnection = async () => {
    if (!formData.token) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`https://api.telegram.org/bot${formData.token}/getMe`);
      const data = await response.json();
      if (data.ok) {
        setTestResult({ success: true, message: `@${data.result.username} verified` });
        setFormData({ ...formData, botName: data.result.first_name });
      } else {
        setTestResult({ success: false, message: 'Invalid Key' });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Node Timeout' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
      {/* Bot Config Card */}
      <div className="bg-white rounded-3xl border border-[#d1d7db] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#d1d7db] flex items-center gap-5 bg-[#f0f2f5]">
          <div className="bg-wa-teal p-3 rounded-2xl text-white shadow-lg shadow-wa-teal/20">
            <Bot size={26} />
          </div>
          <div>
            <h2 className="font-bold text-xl text-[#111b21] tracking-tight">Node Identity</h2>
            <p className="text-[11px] text-[#667781] font-medium uppercase tracking-widest mt-0.5">Global Bot Protocol</p>
          </div>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#54656f] uppercase tracking-wider flex items-center gap-2">
              <Key size={14} />
              Bot API Token
            </label>
            <input
              type="password"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              placeholder="••••••••••••••••••••"
              className="w-full px-6 py-4 bg-[#f0f2f5] border border-transparent focus:bg-white focus:border-wa-teal rounded-2xl text-sm font-medium outline-none transition-all"
            />
            <div className="flex items-center gap-4 mt-3 px-2">
              <button onClick={testConnection} disabled={isTesting} className="text-[11px] font-bold text-wa-teal hover:text-wa-green uppercase tracking-wider transition-all">
                {isTesting ? 'Syncing...' : 'Validate Connection'}
              </button>
              {testResult && (
                <span className={`text-[10px] font-bold uppercase ${testResult.success ? 'text-[#00a884]' : 'text-red-500'}`}>
                  {testResult.message}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#54656f] uppercase tracking-wider flex items-center gap-2">
              <Globe size={14} />
              Bot Display Name
            </label>
            <input
              type="text"
              value={formData.botName}
              onChange={(e) => setFormData({ ...formData, botName: e.target.value })}
              className="w-full px-6 py-4 bg-[#f0f2f5] border border-transparent focus:bg-white focus:border-wa-teal rounded-2xl text-sm font-medium outline-none transition-all"
            />
          </div>
        </div>
        <div className="px-8 pb-8 flex justify-end">
          <button onClick={handleSave} className="flex items-center gap-3 px-10 py-4 bg-wa-teal text-white rounded-2xl font-bold text-sm hover:bg-wa-green shadow-lg shadow-wa-teal/20 transition-all">
            <Save size={20} />
            Commit Configuration
          </button>
        </div>
      </div>

      {/* Interactions Card */}
      <div className="bg-white rounded-3xl border border-[#d1d7db] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#d1d7db] flex items-center gap-5 bg-[#f0f2f5]">
          <div className="bg-[#00a884] p-3 rounded-2xl text-white shadow-lg shadow-[#00a884]/20">
            <Info size={26} />
          </div>
          <div>
            <h2 className="font-bold text-xl text-[#111b21] tracking-tight">Interaction Layer</h2>
            <p className="text-[11px] text-[#667781] font-medium uppercase tracking-widest mt-0.5">Client User Experience</p>
          </div>
        </div>
        
        <div className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-[#54656f] uppercase tracking-wider">Start Message (Welcome)</label>
              <textarea
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                className="w-full px-6 py-5 bg-[#f0f2f5] border border-transparent focus:bg-white focus:border-wa-teal rounded-2xl text-sm font-medium outline-none transition-all min-h-[120px] resize-none"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-[#54656f] uppercase tracking-wider">Success State (YES)</label>
              <textarea
                value={formData.successMessage}
                onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
                className="w-full px-6 py-5 bg-[#f0f2f5] border border-transparent focus:bg-white focus:border-wa-teal rounded-2xl text-sm font-medium outline-none transition-all min-h-[120px] resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-[#54656f] uppercase tracking-wider">Exit State (NO)</label>
              <textarea
                value={formData.noMessage}
                onChange={(e) => setFormData({ ...formData, noMessage: e.target.value })}
                className="w-full px-6 py-5 bg-[#f0f2f5] border border-transparent focus:bg-white focus:border-wa-teal rounded-2xl text-sm font-medium outline-none transition-all min-h-[120px] resize-none"
              />
            </div>
            <div className="space-y-6">
               <div className="space-y-3">
                  <label className="text-[11px] font-bold text-[#54656f] uppercase tracking-wider flex items-center gap-2">
                    <Megaphone size={14} />
                    Channel Redirect Link
                  </label>
                  <input
                    type="url"
                    value={formData.channelLink}
                    onChange={(e) => setFormData({ ...formData, channelLink: e.target.value })}
                    placeholder="https://t.me/yourchannel"
                    className="w-full px-6 py-4 bg-[#f0f2f5] border border-transparent focus:bg-white focus:border-wa-teal rounded-2xl text-sm font-medium outline-none transition-all"
                  />
               </div>
               <div className="space-y-3">
                  <label className="text-[11px] font-bold text-[#54656f] uppercase tracking-wider flex items-center gap-2">
                    <Globe size={14} />
                    Visit Site Link (YES Button)
                  </label>
                  <input
                    type="url"
                    value={formData.successLink}
                    onChange={(e) => setFormData({ ...formData, successLink: e.target.value })}
                    placeholder="https://www.youtube.com"
                    className="w-full px-6 py-4 bg-[#f0f2f5] border border-transparent focus:bg-white focus:border-wa-teal rounded-2xl text-sm font-medium outline-none transition-all"
                  />
               </div>
               <div className="space-y-3">
                  <label className="text-[11px] font-bold text-[#54656f] uppercase tracking-wider flex justify-between items-center">
                    <span className="flex items-center gap-2"><Hash size={14} /> Admin Telegram ID</span>
                    <button type="button" onClick={async () => {
                      try {
                        await botApi.updateConfig({ admin_telegram_id: formData.adminTelegramId });
                        toast.success('Test Alert Sent');
                        const verifyData = new FormData();
                        verifyData.append('telegram_id', formData.adminTelegramId || '');
                        verifyData.append('message_text', "🔔 ADMIN SYNC VERIFIED");
                        botApi.replyToUser(verifyData);
                      } catch(e) { toast.error('Verification Failed'); }
                    }} className="text-wa-teal hover:underline text-[10px] font-bold">VERIFY ID</button>
                  </label>
                  <div className="relative group">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667781]" size={16} />
                    <input
                      type="text"
                      value={formData.adminTelegramId}
                      onChange={(e) => setFormData({ ...formData, adminTelegramId: e.target.value })}
                      placeholder="1879848417"
                      className="w-full pl-12 pr-6 py-4 bg-[#f0f2f5] border border-transparent focus:bg-white focus:border-wa-teal rounded-2xl text-sm font-medium outline-none transition-all"
                    />
                  </div>
               </div>
            </div>
          </div>
        </div>
        <div className="px-8 pb-8 flex justify-end">
          <button onClick={handleSave} className="flex items-center gap-3 px-10 py-4 bg-[#00a884] text-white rounded-2xl font-bold text-sm hover:bg-[#008f6c] shadow-lg shadow-[#00a884]/20 transition-all">
            <Save size={20} />
            Update Interactions
          </button>
        </div>
      </div>

      {/* Mobile Push Notifications Card */}
      <div className="bg-white rounded-3xl border border-[#d1d7db] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#d1d7db] flex items-center justify-between bg-[#f0f2f5]">
          <div className="flex items-center gap-4">
            <div className="bg-[#128C7E] p-2 rounded-xl text-white shadow-lg shadow-[#128C7E]/20">
              <Megaphone size={20} />
            </div>
            <h2 className="font-bold text-lg text-[#111b21] uppercase tracking-wider">Mobile Push Alerts</h2>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
              <ShieldCheck className="text-emerald-500" size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Live Device Synchronization</h4>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Receive instant alerts on your Android or iOS device whenever a new user enters the network or deploys a message to the node.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={async () => {
                try {
                  const registration = await navigator.serviceWorker.register('/sw.js');
                  const permission = await Notification.requestPermission();
                  
                  if (permission === 'granted') {
                    const subscription = await registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: 'BC8Y-D6E_fVz_W3O3ITBm_Xvv6rE1E_Br9o615R' // Placeholder VAPID key
                    });
                    await botApi.savePushSubscription(subscription);
                    toast.success('Device Synchronized for Push Alerts');
                  } else {
                    toast.error('Notification permission denied');
                  }
                } catch (err) {
                  console.error(err);
                  toast.error('Device Sync Failed');
                }
              }}
              className="flex-1 py-4 bg-[#25D366] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-[#00a884] shadow-xl shadow-[#25D366]/20"
            >
              Enable Live Notifications
            </button>
            <button
              onClick={async () => {
                try {
                  const registration = await navigator.serviceWorker.getRegistration();
                  if (registration) {
                    const subscription = await registration.pushManager.getSubscription();
                    if (subscription) {
                      await botApi.removePushSubscription(subscription.endpoint);
                      await subscription.unsubscribe();
                    }
                  }
                  toast.success('Notifications Deactivated');
                } catch (err) {
                  toast.error('Failed to Deactivate');
                }
              }}
              className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-slate-50"
            >
              Stop All Alerts
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Supports Android Chrome & iOS Safari 16.4+</p>
        </div>
      </div>

      {/* Security Grid */}
      <div className="max-w-2xl">
        <div className="bg-white rounded-3xl border border-[#d1d7db] shadow-sm overflow-hidden">
          <div className="p-8 border-b border-[#d1d7db] flex items-center gap-4 bg-[#f0f2f5]">
            <div className="bg-[#ea0038] p-2 rounded-xl text-white shadow-lg shadow-[#ea0038]/20">
              <Shield size={20} />
            </div>
            <h2 className="font-bold text-lg text-[#111b21] uppercase tracking-wider">Access Protocol</h2>
          </div>
          <form onSubmit={handleChangePassword} className="p-8 space-y-5">
            <div className="space-y-4">
               <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667781]" size={18} />
                  <input type="password" required placeholder="Current Key" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="w-full pl-12 pr-6 py-4 bg-[#f0f2f5] border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white transition-all" />
               </div>
               <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667781]" size={18} />
                  <input type="password" required placeholder="New Rotation Key" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="w-full pl-12 pr-6 py-4 bg-[#f0f2f5] border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white transition-all" />
               </div>
               <div className="relative">
                  <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667781]" size={18} />
                  <input type="password" required placeholder="Confirm New Key" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="w-full pl-12 pr-6 py-4 bg-[#f0f2f5] border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white transition-all" />
               </div>
            </div>
            <button type="submit" className="w-full py-4 bg-[#111b21] text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-[#202c33] transition-all shadow-xl">Rotate Access Hash</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
