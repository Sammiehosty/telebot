import React from 'react';
import { LucideIcon, Bot } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: NavItem[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  botName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ items, activeTab, setActiveTab, botName }) => {
  return (
    <aside className="w-72 bg-[#f0f2f5] border-r border-[#d1d7db] flex flex-col h-screen overflow-hidden">
      {/* Header-like top in sidebar */}
      <div className="h-24 px-6 bg-[#f0f2f5] flex items-center justify-between border-b border-[#d1d7db]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#00a884] rounded-full flex items-center justify-center text-white shadow-sm">
            <Bot size={28} />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-[#111b21] block leading-tight">TeleBot</span>
            <span className="text-[11px] text-[#667781] truncate block">{botName}</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-[#e9edef]",
                isActive ? "bg-[#e9edef]" : "bg-transparent"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isActive ? "bg-wa-teal text-white" : "bg-transparent text-[#54656f]"
              )}>
                <Icon size={22} />
              </div>
              <div className="flex-1 text-left border-b border-[#e9edef] pb-4 -mb-4">
                <p className="font-semibold text-[#111b21]">{item.label}</p>
                <p className="text-xs text-[#667781] truncate">Click to manage</p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 bg-[#f0f2f5] border-t border-[#d1d7db]">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e9edef]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#25d366] rounded-full shadow-[0_0_5px_#25d366]" />
            <span className="text-[10px] font-bold text-[#111b21] uppercase tracking-wider">System Active</span>
          </div>
          <p className="text-[10px] text-[#667781]">Connected to Mainnet 2.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
