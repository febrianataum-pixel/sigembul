
import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { ShieldCheck, Lock, Mail, Loader2, ArrowRight, Sun, Moon } from 'lucide-react';
import { AppConfig } from '../types';

interface LoginProps {
  config: AppConfig;
}

const Login: React.FC<LoginProps> = ({ config }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = getAuth(getApp());
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Email atau Password salah. Pastikan sudah terdaftar di Firebase Console.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-white dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="p-10 text-center border-b border-slate-100 dark:border-slate-800 bg-slate-900 text-white">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
              <ShieldCheck size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">{config.appName}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Autentikasi Operator Desa</p>
          </div>

          <form onSubmit={handleLogin} className="p-10 space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase text-center animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="email" 
                  placeholder="Email Operator" 
                  className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-600/10 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-600/10 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 dark:hover:bg-blue-500 transition-all flex items-center justify-center space-x-3 group"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <span>Masuk Ke Sistem</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="text-center pt-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-relaxed">
                Database Desa Ngumbul Dilindungi Oleh Enkripsi Cloud Blora.
              </p>
            </div>
          </form>
        </div>
        
        <div className="mt-8 text-center flex items-center justify-center space-x-6 text-slate-400 dark:text-slate-600">
           <span className="text-[10px] font-black uppercase tracking-widest">© 2026 OneNine Studio</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
