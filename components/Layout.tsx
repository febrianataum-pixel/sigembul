
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Search as SearchIcon,
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  ChevronRight,
  Archive,
  Baby,
  HeartPulse,
  PanelLeftClose,
  PanelLeftOpen,
  Cloud,
  CloudOff,
  RefreshCcw,
  Sun,
  Moon
} from 'lucide-react';
import { AppConfig, AppTheme } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  isSyncing?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, config, setConfig, isSyncing }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const theme = config.theme || 'light';

  const toggleTheme = () => {
    setConfig(prev => ({
      ...prev,
      theme: theme === 'light' ? 'dark' : 'light'
    }));
  };

  // Menu Lengkap untuk Sidebar Desktop
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'penduduk', label: 'Penduduk', icon: Users },
    { id: 'kelahiran', label: 'Kelahiran', icon: Baby },
    { id: 'kehamilan', label: 'Kehamilan', icon: HeartPulse },
    { id: 'arsip', label: 'Arsip', icon: Archive },
    { id: 'rekap', label: 'Indikator', icon: BarChart3 },
    { id: 'pencarian', label: 'Cari', icon: SearchIcon },
    { id: 'profil', label: 'Profil', icon: Settings },
  ];

  // Menu Bottom Nav Mobile (Swap Arsip dengan Kehamilan/KIA)
  const bottomNavItems = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'penduduk', label: 'Data', icon: Users },
    { id: 'pencarian', label: 'Cari', icon: SearchIcon },
    { id: 'kehamilan', label: 'KIA', icon: HeartPulse },
    { id: 'profil', label: 'Profil', icon: Settings },
  ];

  const getInitials = (name: string) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const sidebarWidth = isSidebarCollapsed ? 'w-20' : 'w-64';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      <div className="flex w-full flex-1 bg-inherit text-slate-900 dark:text-slate-100">
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
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} pb-20 md:pb-0`}>
          <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-14 md:h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
            <div className="flex items-center space-x-3">
              <div className="md:hidden flex items-center space-x-2">
                <img src={config.logoUrl} alt="Logo" className="w-7 h-7 rounded p-0.5 bg-slate-100" />
                <h1 className="text-xs font-black uppercase tracking-tighter truncate max-w-[120px] text-slate-950 dark:text-white">{config.appName}</h1>
              </div>
              <h2 className="hidden md:block text-lg font-black uppercase tracking-widest text-slate-950 dark:text-slate-100">
                {menuItems.find(i => i.id === activeTab)?.label}
              </h2>
            </div>
            
            <div className="flex items-center space-x-1.5">
               <button 
                 onClick={toggleTheme}
                 className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 transition-all"
               >
                 {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
               </button>

               <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 pl-1 pr-2.5 py-1 rounded-full">
                  <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white text-[8px] font-black uppercase">
                    {getInitials(config.operatorName)}
                  </div>
                  <span className="hidden lg:inline text-[9px] font-black text-slate-950 dark:text-slate-300 uppercase truncate max-w-[80px]">
                    {config.operatorName}
                  </span>
               </div>
            </div>
          </header>

          <main className="flex-1 p-3 md:p-8 overflow-x-hidden">
            {children}
          </main>
        </div>

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex justify-around items-center px-1 py-2.5 z-[60] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          {bottomNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[50px] transition-all ${
                activeTab === item.id ? 'text-blue-600 scale-105' : 'text-slate-400'
              }`}
            >
              <item.icon size={activeTab === item.id ? 20 : 18} strokeWidth={activeTab === item.id ? 3 : 2} />
              <span className={`text-[7px] font-black uppercase mt-1.5 tracking-tighter ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
