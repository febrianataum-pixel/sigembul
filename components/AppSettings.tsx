
import React, { useState, useEffect } from 'react';
import { Save, Globe, RefreshCcw, User, Shield, Info, Image as ImageIcon, Server, Cloud, Database, Wifi, WifiOff } from 'lucide-react';
import { AppConfig } from '../types';

interface AppSettingsProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const AppSettings: React.FC<AppSettingsProps> = ({ config, setConfig }) => {
  const [formData, setFormData] = useState<AppConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  // Sinkronkan form jika ada update dari Cloud (Browser lain)
  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleUpdateFirebase = () => {
    const newConfig = { ...formData };
    if (newConfig.firebaseConfig && newConfig.firebaseConfig.projectId && !newConfig.firebaseConfig.enabled) {
      newConfig.firebaseConfig.enabled = true;
    }
    setFormData(newConfig);
    setConfig(newConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
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
              <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-black text-xs uppercase" value={formData.appName} onChange={(e) => setFormData({...formData, appName: e.target.value})} />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Wilayah / Subtitle</label>
              <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-xs" value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nama Kepala Desa (TTD PDF)</label>
              <div className="relative">
                <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-black text-xs uppercase" value={formData.villageHeadName} onChange={(e) => setFormData({...formData, villageHeadName: e.target.value})} placeholder="SULARNO" />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Logo URL</label>
              <div className="relative">
                <ImageIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold text-xs" value={formData.logoUrl} onChange={(e) => setFormData({...formData, logoUrl: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nama Operator</label>
              <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-black text-xs uppercase" value={formData.operatorName} onChange={(e) => setFormData({...formData, operatorName: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2 transition-all hover:bg-blue-600">
            <Save size={16} />
            <span>Simpan & Sinkron Profil</span>
          </button>
        </form>
      </div>

      <div className="bg-slate-950 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl text-white">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <Cloud size={18} className={`${formData.firebaseConfig?.enabled ? 'text-emerald-400' : 'text-blue-400'}`} />
             <h2 className="text-sm font-black uppercase tracking-widest">Firebase Realtime Sync</h2>
          </div>
          <div className="flex items-center space-x-3">
             <span className={`text-[8px] font-black uppercase tracking-tighter ${formData.firebaseConfig?.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                {formData.firebaseConfig?.enabled ? 'Cloud Aktif' : 'Off'}
             </span>
             <button 
               onClick={() => updateFirebase('enabled', !formData.firebaseConfig?.enabled)}
               className={`w-12 h-6 rounded-full transition-all relative ${formData.firebaseConfig?.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
             >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${formData.firebaseConfig?.enabled ? 'left-7' : 'left-1'}`}></div>
             </button>
          </div>
        </div>

        <div className="p-8 space-y-5">
           <div className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-4">
              <div className="flex items-center space-x-3 mb-2">
                 {formData.firebaseConfig?.enabled ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-rose-400" />}
                 <p className="text-[10px] font-black uppercase tracking-widest">
                   Status Koneksi: {formData.firebaseConfig?.enabled ? 'SIAP SINKRON' : 'LOKAL SAJA'}
                 </p>
              </div>
              <p className="text-[9px] text-slate-500 font-bold leading-relaxed">Aktifkan Switch di atas untuk menyambungkan semua browser ke database yang sama.</p>
           </div>
           
           <div className="space-y-4">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Project ID</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono focus:bg-white/10 outline-none focus:border-blue-500 transition-all" value={formData.firebaseConfig?.projectId || ''} onChange={(e) => updateFirebase('projectId', e.target.value)} placeholder="my-project-id" />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">API Key</label>
                <input type="password" name="apiKey" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono focus:bg-white/10 outline-none focus:border-blue-500 transition-all" value={formData.firebaseConfig?.apiKey || ''} onChange={(e) => updateFirebase('apiKey', e.target.value)} placeholder="AIzaSy..." />
              </div>
           </div>

           <button onClick={handleUpdateFirebase} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-blue-500 active:scale-95 flex items-center justify-center space-x-2">
             <RefreshCcw size={16} className={isSaved ? "animate-spin" : ""} />
             <span>Terapkan Konfigurasi Cloud</span>
           </button>
        </div>
      </div>

      {isSaved && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase shadow-2xl animate-in slide-in-from-bottom">
           Berhasil Sinkron ke Cloud!
        </div>
      )}
    </div>
  );
};

export default AppSettings;
