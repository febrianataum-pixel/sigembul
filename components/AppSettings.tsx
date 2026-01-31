
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

  const updateFirebase = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      firebaseConfig: {
        ...(prev.firebaseConfig || {
          apiKey: '',
          authDomain: '',
          projectId: '',
          storageBucket: '',
          messagingSenderId: '',
          appId: '',
          enabled: false
        }),
        [field]: value
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
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

      <div className="bg-slate-950 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl text-white">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <Cloud size={18} className="text-emerald-400" />
             <h2 className="text-sm font-black uppercase tracking-widest">Firebase Cloud Control</h2>
          </div>
          <button 
             onClick={() => updateFirebase('enabled', !formData.firebaseConfig?.enabled)}
             className={`w-12 h-6 rounded-full transition-all relative ${formData.firebaseConfig?.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${formData.firebaseConfig?.enabled ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>

        <div className="p-8 space-y-5">
           {user ? (
             <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                   <User size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                   <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Sesi Aktif Sebagai</p>
                   <p className="text-xs font-black truncate">{user.email}</p>
                </div>
             </div>
           ) : (
             <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center">
                   <Key size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                   <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Status Keamanan</p>
                   <p className="text-xs font-black truncate">Belum Terautentikasi</p>
                </div>
             </div>
           )}

           <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={onForcePush} disabled={!user} className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group disabled:opacity-20 disabled:cursor-not-allowed">
                 <UploadCloud size={24} className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Unggah Paksa</span>
              </button>
              <button onClick={onForcePull} disabled={!user} className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group disabled:opacity-20 disabled:cursor-not-allowed">
                 <DownloadCloud size={24} className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Ambil Paksa</span>
              </button>
           </div>

           <div className="space-y-4">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Project ID</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono focus:bg-white/10 outline-none" value={formData.firebaseConfig?.projectId || ''} onChange={(e) => updateFirebase('projectId', e.target.value)} placeholder="siga-ngumbul-xxxxx" />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">API Key</label>
                <input type="password" name="apiKey" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono focus:bg-white/10 outline-none" value={formData.firebaseConfig?.apiKey || ''} onChange={(e) => updateFirebase('apiKey', e.target.value)} placeholder="AIzaSy..." />
              </div>
           </div>

           <button 
             onClick={() => handleSave()} 
             className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center space-x-2 ${isApplying ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500'}`}
             disabled={isApplying}
           >
             {isApplying ? <RefreshCcw size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
             <span>{isApplying ? 'Menerapkan...' : 'Terapkan Konfigurasi'}</span>
           </button>
           
           <p className="text-[8px] text-slate-500 text-center font-bold uppercase tracking-widest leading-relaxed">
             Pastikan Auth Domain & Project ID Benar Agar Sinkronisasi Berjalan.
           </p>
        </div>
      </div>
    </div>
  );
};

export default AppSettings;
