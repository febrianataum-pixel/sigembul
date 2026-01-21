
import React, { useState } from 'react';
import { Save, Globe, RefreshCcw, User, Shield, Info, Image as ImageIcon, Server, Cloud, Database } from 'lucide-react';
import { AppConfig } from '../types';

interface AppSettingsProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

const AppSettings: React.FC<AppSettingsProps> = ({ config, setConfig }) => {
  const [formData, setFormData] = useState<AppConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const updateFirebase = (field: string, value: any) => {
    setFormData({
      ...formData,
      firebaseConfig: {
        ...(formData.firebaseConfig || {
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
    });
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm h-fit">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest">Profil Aplikasi & Desa</h2>
          <Globe size={18} className="text-blue-600" />
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nama Aplikasi</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-xs uppercase" value={formData.appName} onChange={(e) => setFormData({...formData, appName: e.target.value})} />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Wilayah / Subtitle</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs" value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nama Kepala Desa (TTD PDF)</label>
              <div className="relative">
                <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-black text-xs uppercase" value={formData.villageHeadName} onChange={(e) => setFormData({...formData, villageHeadName: e.target.value})} placeholder="SULARNO" />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Logo URL</label>
              <div className="relative">
                <ImageIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-bold text-xs" value={formData.logoUrl} onChange={(e) => setFormData({...formData, logoUrl: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nama Operator</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-xs uppercase" value={formData.operatorName} onChange={(e) => setFormData({...formData, operatorName: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2 transition-all hover:bg-blue-600">
            <Save size={16} />
            <span>Simpan Profil</span>
          </button>
        </form>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl text-white">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <Cloud size={18} className="text-blue-400" />
             <h2 className="text-sm font-black uppercase tracking-widest">Firebase Realtime Sync</h2>
          </div>
          <div className="flex items-center space-x-2">
             <span className="text-[8px] font-black uppercase tracking-tighter">Status Sync:</span>
             <button 
               onClick={() => updateFirebase('enabled', !formData.firebaseConfig?.enabled)}
               className={`w-10 h-5 rounded-full transition-all relative ${formData.firebaseConfig?.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
             >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.firebaseConfig?.enabled ? 'left-6' : 'left-1'}`}></div>
             </button>
          </div>
        </div>

        <div className="p-8 space-y-5">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Konfigurasi Cloud Firestore untuk penyimpanan data terpusat secara real-time.</p>
           
           <div className="space-y-4">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Project ID</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono" value={formData.firebaseConfig?.projectId || ''} onChange={(e) => updateFirebase('projectId', e.target.value)} placeholder="my-project-id" />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">API Key</label>
                <input type="password" name="apiKey" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono" value={formData.firebaseConfig?.apiKey || ''} onChange={(e) => updateFirebase('apiKey', e.target.value)} placeholder="AIzaSy..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Auth Domain</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono" value={formData.firebaseConfig?.authDomain || ''} onChange={(e) => updateFirebase('authDomain', e.target.value)} />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">App ID</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono" value={formData.firebaseConfig?.appId || ''} onChange={(e) => updateFirebase('appId', e.target.value)} />
                </div>
              </div>
           </div>

           <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-start space-x-3">
                 <Database size={16} className="text-amber-500 mt-1" />
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Pastikan Security Rules di Firestore diset ke true untuk testing, atau gunakan Firebase Auth untuk keamanan produksi.</p>
              </div>
           </div>

           <button onClick={handleSave} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-blue-500 mt-4">
             Update Konfigurasi API
           </button>
        </div>
      </div>

      {isSaved && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase shadow-2xl animate-in slide-in-from-top">
           Pengaturan Berhasil Disimpan & Sinkron!
        </div>
      )}
    </div>
  );
};

export default AppSettings;
