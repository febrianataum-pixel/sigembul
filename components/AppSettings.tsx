
import React, { useState, useEffect } from 'react';
import { Save, Globe, RefreshCcw, User, Shield, Image as ImageIcon, Cloud, Database, Wifi, WifiOff, UploadCloud, DownloadCloud, LogOut, Key, CheckCircle2 } from 'lucide-react';
import { AppConfig } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface AppSettingsProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  onForcePush: () => void;
  onForcePull: () => void;
  user: FirebaseUser | null;
  onLogout: () => void;
}

const AppSettings: React.FC<AppSettingsProps> = ({ config, setConfig, onForcePush, onForcePull, user, onLogout }) => {
  const [formData, setFormData] = useState<AppConfig>(config);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsApplying(true);
    setConfig(formData);
    
    setTimeout(() => {
      setIsApplying(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 800);
  };

  const toggleCloud = () => {
    setFormData(prev => ({
      ...prev,
      firebaseConfig: {
        ...(prev.firebaseConfig || { enabled: false }),
        enabled: !prev.firebaseConfig?.enabled
      }
    }));
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm h-fit">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Profil Aplikasi & Desa</h2>
          <Globe size={18} className="text-blue-600" />
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nama Aplikasi</label>
              <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-black text-xs uppercase outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.appName} onChange={(e) => setFormData({...formData, appName: e.target.value})} />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nama Kepala Desa (TTD PDF)</label>
              <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-black text-xs uppercase outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.villageHeadName} onChange={(e) => setFormData({...formData, villageHeadName: e.target.value})} />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nama Operator</label>
              <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-black text-xs uppercase outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.operatorName} onChange={(e) => setFormData({...formData, operatorName: e.target.value})} />
            </div>
          </div>

          <button type="submit" className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2 transition-all ${isSaved ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-blue-600'}`}>
            {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            <span>{isSaved ? 'Berhasil Disimpan' : 'Simpan Perubahan'}</span>
          </button>

          {user && (
            <button 
              type="button" 
              onClick={onLogout}
              className="w-full py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 border border-rose-100 dark:border-rose-900/30 transition-all hover:bg-rose-600 hover:text-white"
            >
              <LogOut size={16} />
              <span>Keluar Sesi (Logout)</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AppSettings;
