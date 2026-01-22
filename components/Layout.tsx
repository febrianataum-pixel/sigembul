
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  ChevronRight,
  Archive,
  Baby,
  PanelLeftClose,
  PanelLeftOpen,
  Cloud,
  CloudOff,
  RefreshCcw
} from 'lucide-react';
import { AppConfig } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: AppConfig;
  isSyncing?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, config, isSyncing }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'penduduk', label: 'Data Penduduk', icon: Users },
    { id: 'kelahiran', label: 'Kelahiran', icon: Baby },
    { id: 'arsip', label: 'Arsip', icon: Archive },
    { id: 'rekap', label: 'Rekap Indikator', icon: BarChart3 },
    { id: 'profil', label: 'Profil Aplikasi', icon: Settings },
  ];

  const getInitials = (name: string) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const sidebarWidth = isSidebarCollapsed ? 'w-20' : 'w-64';

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 transition-all duration-300">
      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex flex-col ${sidebarWidth} bg-slate-900 text-white shadow-xl fixed h-full transition-all duration-300 z-40`}>
        <div className={`p-6 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <img 
            src={config.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/1/1d/Lambang_Kabupaten_Blora.png"} 
            alt="Logo" 
            className="w-10 h-10 rounded-lg bg-white p-1 min-w-[40px]"
          />
          {!isSidebarCollapsed && (
            <div className="animate-in fade-in duration-300 min-w-0 flex-1">
              <h1 className="font-bold text-base lg:text-lg leading-tight uppercase tracking-tighter truncate">{config.appName}</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-tight mt-1 whitespace-normal break-words">
                {config.subtitle}
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center rounded-xl transition-all group ${
                isSidebarCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'
              } ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {!isSidebarCollapsed && <span className="font-bold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`w-full flex items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-sm font-bold ${
              isSidebarCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'
            }`}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            {!isSidebarCollapsed && <span className="font-bold text-sm">Sembunyikan</span>}
          </button>
          <div className="mt-4 pt-4 border-t border-slate-800/50 text-center">
             <p className={`text-[10px] font-bold text-slate-600 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>OneNine Studio | 2026</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 h-14 md:h-16 flex items-center justify-between px-3 md:px-8 sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-[11px] md:text-lg font-black uppercase tracking-widest text-slate-800 truncate max-w-[120px] md:max-w-none">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
             {/* Cloud Sync Status Indicator */}
             <div className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all ${
               config.firebaseConfig?.enabled 
                 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                 : 'bg-slate-50 border-slate-100 text-slate-400'
             }`}>
                {config.firebaseConfig?.enabled ? (
                  isSyncing ? (
                    <RefreshCcw size={12} className="animate-spin" />
                  ) : (
                    <Cloud size={12} />
                  )
                ) : (
                  <CloudOff size={12} />
                )}
                <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                  {config.firebaseConfig?.enabled ? (isSyncing ? 'Sinkronisasi...' : 'Cloud Aktif') : 'Mode Lokal'}
                </span>
             </div>

             <div className="flex items-center space-x-2 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                <span className="text-[8px] md:text-xs font-black text-slate-700 uppercase tracking-tight max-w-[60px] md:max-w-none truncate">
                  {config.operatorName || 'OPERATOR'}
                </span>
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[8px] md:text-[10px] font-black uppercase shadow-inner">
                  {getInitials(config.operatorName)}
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 p-3 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[80%] max-w-xs bg-slate-900 text-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={config.logoUrl} alt="Logo" className="w-8 h-8 rounded bg-white p-0.5" />
                <h1 className="font-bold text-xs uppercase tracking-tighter truncate">{config.appName}</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-800 rounded-xl text-slate-400">
                <X size={18} />
              </button>
            </div>
            <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all ${
                    activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="font-bold uppercase text-[10px] tracking-widest">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-6 border-t border-slate-800 text-center">
               <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">OneNine Studio | 2026</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
