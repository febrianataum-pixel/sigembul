
import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../firebase';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { AppConfig } from '../types';

interface LoginProps {
  config: AppConfig;
}

const Login: React.FC<LoginProps> = ({ config }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      setError('Firebase belum dikonfigurasi di secrets.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError('Gagal masuk dengan Google. Silakan coba lagi.');
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Autentikasi Cloud Operator</p>
          </div>

          <div className="p-10 space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase text-center animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                Gunakan akun Google yang terdaftar untuk mengakses sistem manajemen data desa.
              </p>
              
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-[1.5rem] font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center space-x-3 group"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    <span>Masuk dengan Google</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-relaxed">
                Database Desa Ngumbul Sinkron Secara Real-time dengan Server Cloud.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center flex items-center justify-center space-x-6 text-slate-400 dark:text-slate-600">
           <span className="text-[10px] font-black uppercase tracking-widest">© 2026 GEMBUL Cloud Control</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
