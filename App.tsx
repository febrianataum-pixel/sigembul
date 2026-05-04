
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PopulationManagement from './components/PopulationManagement';
import RecapIndicators from './components/RecapIndicators';
import AppSettings from './components/AppSettings';
import ArchivedResidents from './components/ArchivedResidents';
import BirthManagement from './components/BirthManagement';
import PregnancyManagement from './components/PregnancyManagement';
import AdvancedSearch from './components/AdvancedSearch';
import Login from './components/Login';
import { Resident, AppConfig } from './types';
import { getDb, getFirebaseAuth, isFirebaseConfigured, firebaseConfig } from './firebase';
import { collection, doc, writeBatch, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

const App: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>(() => {
    const saved = localStorage.getItem('siga_residents');
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('siga_config');
    const baseConfig = saved ? JSON.parse(saved) : {
      appName: 'GEMBUL (Gerbang Data Ngumbul)',
      subtitle: 'Kec. Todanan, Kab. Blora',
      logoUrl: 'https://i.ibb.co.com/jPz7kW5J/Chat-GPT-Image-Feb-4-2026-09-56-11-AM.png',
      operatorName: 'ADMIN DESA',
      villageHeadName: 'SULARNO',
      theme: 'light',
      firebaseConfig: { enabled: true }
    };
    
    // If secrets are present, ensure cloud is enabled by default
    if (isFirebaseConfigured) {
      baseConfig.firebaseConfig.enabled = true;
    }
    return baseConfig;
  });

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const isHydrated = useRef(false); 
  const isInternalUpdate = useRef(false);
  const prevResidentsRef = useRef<Resident[]>(residents);

  // 0. Simpan Config ke LocalStorage
  useEffect(() => {
    localStorage.setItem('siga_config', JSON.stringify(config));
    const root = window.document.documentElement;
    if (config.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [config]);

  // 1. Firebase Auth Listener
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !isFirebaseConfigured) {
      setAuthLoading(false);
      setUser(null);
      return;
    }

    setAuthLoading(true);
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [config.firebaseConfig?.enabled]);

  // 2. Firebase Realtime Listener (MERGE MODE)
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !isFirebaseConfigured || !user) {
      isHydrated.current = true;
      return;
    }

    let unsubRes = () => {};
    try {
      const db = getDb();
      unsubRes = onSnapshot(collection(db, "residents_db"), (snap) => {
        if (snap.metadata.hasPendingWrites) return;

        setResidents(prev => {
          let next = [...prev];
          let hasChanged = false;

          snap.docChanges().forEach(change => {
            const cloudData = change.doc.data() as Resident;
            const idx = next.findIndex(r => r.id === cloudData.id);

            if (change.type === 'added' || change.type === 'modified') {
              if (idx > -1) {
                if (JSON.stringify(next[idx]) !== JSON.stringify(cloudData)) {
                  next[idx] = cloudData;
                  hasChanged = true;
                }
              } else {
                next.push(cloudData);
                hasChanged = true;
              }
            } else if (change.type === 'removed') {
              if (idx > -1) {
                next.splice(idx, 1);
                hasChanged = true;
              }
            }
          });

          if (hasChanged) {
            isInternalUpdate.current = true;
            prevResidentsRef.current = next;
            localStorage.setItem('siga_residents', JSON.stringify(next));
            return next;
          }
          return prev;
        });
        isHydrated.current = true;
      });
    } catch (e) {
      isHydrated.current = true;
    }
    return () => unsubRes();
  }, [user, config.firebaseConfig?.enabled]);

  // 3. AUTO-SYNC
  useEffect(() => {
    localStorage.setItem('siga_residents', JSON.stringify(residents));
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    if (config.firebaseConfig?.enabled && user) {
      const changedResidents = residents.filter(curr => {
        const prev = prevResidentsRef.current.find(p => p.id === curr.id);
        return !prev || JSON.stringify(prev) !== JSON.stringify(curr);
      });

      if (changedResidents.length > 0 && changedResidents.length < 50) {
        const db = getDb();
        changedResidents.forEach(async (res) => {
          try {
            await setDoc(doc(db, "residents_db", res.id), res);
          } catch (e) {
            console.error("Auto-sync error for", res.fullName, e);
          }
        });
      }
    }
    prevResidentsRef.current = residents;
  }, [residents, user, config.firebaseConfig?.enabled]);

  const forcePush = async () => {
    if (!config.firebaseConfig?.enabled || !user) return alert("Firebase belum aktif atau belum login.");
    setIsSyncing(true);
    try {
      const db = getDb();
      let batch = writeBatch(db);
      let count = 0;
      for (const res of residents) {
        const docRef = doc(db, "residents_db", res.id);
        batch.set(docRef, res);
        count++;
        if (count % 500 === 0) {
          await batch.commit();
          batch = writeBatch(db);
        }
      }
      if (count % 500 !== 0) await batch.commit();
      alert(`Berhasil mengunggah ${count} data penduduk ke Cloud.`);
    } catch (e: any) { 
      alert("Gagal unggah: " + e.message); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  const forcePull = async () => {
    if (!config.firebaseConfig?.enabled || !user) return alert("Firebase belum aktif atau belum login.");
    setIsSyncing(true);
    try {
      const db = getDb();
      const querySnapshot = await getDocs(collection(db, "residents_db"));
      const cloudList: Resident[] = [];
      querySnapshot.forEach((doc) => {
        cloudList.push(doc.data() as Resident);
      });
      if (cloudList.length > 0) {
        isInternalUpdate.current = true;
        setResidents(cloudList);
        localStorage.setItem('siga_residents', JSON.stringify(cloudList));
        alert(`Berhasil mengambil ${cloudList.length} data dari Cloud.`);
      } else { 
        alert("Data di Cloud masih kosong."); 
      }
    } catch (e: any) { 
      alert("Gagal ambil data: " + e.message); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      setUser(null);
      setActiveTab('dashboard');
      // Ensure cloud stays enabled on logout if configured
      if (isFirebaseConfigured) {
        setConfig(prev => ({
          ...prev,
          firebaseConfig: { ...prev.firebaseConfig, enabled: true }
        }));
      }
    } catch (e) {
      alert("Gagal Keluar");
    }
  };

  const renderContent = () => {
    const activeResidents = residents.filter(r => r.status === 'Aktif');
    switch (activeTab) {
      case 'dashboard': return <Dashboard residents={activeResidents} />;
      case 'penduduk': return <PopulationManagement residents={residents} setResidents={setResidents} config={config} />;
      case 'pencarian': return <AdvancedSearch residents={activeResidents} setResidents={setResidents} config={config} />;
      case 'kelahiran': return <BirthManagement residents={residents} setResidents={setResidents} />;
      case 'kehamilan': return <PregnancyManagement residents={residents} setResidents={setResidents} />;
      case 'arsip': return <ArchivedResidents residents={residents} setResidents={setResidents} />;
      case 'rekap': return <RecapIndicators residents={activeResidents} config={config} />;
      case 'profil': return <AppSettings config={config} setConfig={setConfig} onForcePush={forcePush} onForcePull={forcePull} user={user} onLogout={handleLogout} />;
      default: return <Dashboard residents={activeResidents} />;
    }
  };

  if (config.firebaseConfig?.enabled && !isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto">
            <div className="text-rose-600 dark:text-rose-400 font-bold text-2xl">!</div>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Cloud Belum Dikonfigurasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            API Key atau Project ID belum disetel di rahasia (secrets) lingkungan.
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-left font-mono text-[10px] break-all">
            VITE_FIREBASE_API_KEY <br/>
            VITE_FIREBASE_PROJECT_ID
          </div>
          <button 
            onClick={() => setConfig(prev => ({ ...prev, firebaseConfig: { ...prev.firebaseConfig, enabled: false } }))}
            className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
          >
            Gunakan Offline Saja
          </button>
        </div>
      </div>
    );
  }

  if (config.firebaseConfig?.enabled && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Menghubungkan ke Cloud...</p>
        </div>
      </div>
    );
  }

  if (config.firebaseConfig?.enabled && !user) {
    return <Login config={config} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} config={config} setConfig={setConfig} isSyncing={isSyncing} onLogout={handleLogout} user={user}>
      {renderContent()}
    </Layout>
  );
};

export default App;
