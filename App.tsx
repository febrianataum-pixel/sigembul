
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
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';

const App: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>(() => {
    const saved = localStorage.getItem('siga_residents');
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('siga_config');
    return saved ? JSON.parse(saved) : {
      appName: 'SIGA Ngumbul',
      subtitle: 'Kec. Todanan, Kab. Blora',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Lambang_Kabupaten_Blora.png',
      operatorName: 'ADMIN DESA',
      villageHeadName: 'SULARNO',
      theme: 'light',
      firebaseConfig: { enabled: false }
    };
  });

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const isHydrated = useRef(false); 
  const isInternalUpdate = useRef(false);
  const lastUpdateToken = useRef<string | null>(null);

  // Sync Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (config.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [config.theme]);

  // 1. Firebase Auth Listener
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !config.firebaseConfig.projectId) {
      setAuthLoading(false);
      return;
    }

    try {
      const firebaseApp = getApps().length === 0 ? initializeApp(config.firebaseConfig) : getApp();
      const auth = getAuth(firebaseApp);
      
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      });
      
      return () => unsubscribe();
    } catch (e) {
      setAuthLoading(false);
    }
  }, [config.firebaseConfig?.enabled, config.firebaseConfig?.projectId]);

  // 2. Firebase Database Listener (Hanya jika Login)
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !config.firebaseConfig.projectId || !user) {
      isHydrated.current = true;
      return;
    }

    let unsubRes = () => {};
    try {
      const db = getFirestore(getApp());
      unsubRes = onSnapshot(doc(db, "ngumbul_data", "residents_master"), (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const cloudData = snap.data();
          if (cloudData.lastUpdated !== lastUpdateToken.current) {
            lastUpdateToken.current = cloudData.lastUpdated;
            const cloudList = cloudData.list || [];
            isInternalUpdate.current = true;
            setResidents(cloudList);
            localStorage.setItem('siga_residents', JSON.stringify(cloudList));
          }
        }
        isHydrated.current = true;
      }, (err) => {
        console.error("Firebase Sync Error:", err);
        isHydrated.current = true;
      });
    } catch (e) {
      isHydrated.current = true;
    }
    return () => unsubRes();
  }, [user, config.firebaseConfig?.enabled]);

  // 3. Firebase Sync (UPLOAD - Hanya jika Login)
  useEffect(() => {
    localStorage.setItem('siga_residents', JSON.stringify(residents));

    if (!isHydrated.current || !user) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    if (config.firebaseConfig?.enabled && config.firebaseConfig.projectId) {
      if (residents.length === 0 && !lastUpdateToken.current) return;

      const timer = setTimeout(async () => {
        setIsSyncing(true);
        try {
          const db = getFirestore(getApp());
          const now = new Date().toISOString();
          lastUpdateToken.current = now;
          await setDoc(doc(db, "ngumbul_data", "residents_master"), { 
            list: residents,
            lastUpdated: now
          });
        } catch (e) {
          console.error(e);
        } finally {
          setIsSyncing(false);
        }
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [residents, user]);

  const forcePush = async () => {
    if (!config.firebaseConfig?.enabled || !user) return;
    setIsSyncing(true);
    try {
      const db = getFirestore(getApp());
      const now = new Date().toISOString();
      lastUpdateToken.current = now;
      await setDoc(doc(db, "ngumbul_data", "residents_master"), { list: residents, lastUpdated: now });
      alert("Berhasil mengunggah data lokal ke Cloud.");
    } catch (e) { alert("Gagal unggah: " + e); }
    finally { setIsSyncing(false); }
  };

  const forcePull = async () => {
    if (!config.firebaseConfig?.enabled || !user) return;
    setIsSyncing(true);
    try {
      const db = getFirestore(getApp());
      const snap = await getDoc(doc(db, "ngumbul_data", "residents_master"));
      if (snap.exists()) {
        const data = snap.data();
        setResidents(data.list || []);
        alert("Berhasil mengambil data dari Cloud.");
      } else { alert("Data di Cloud kosong."); }
    } catch (e) { alert("Gagal ambil data: " + e); }
    finally { setIsSyncing(false); }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth(getApp());
      await signOut(auth);
      setUser(null);
    } catch (e) {
      alert("Gagal Keluar");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  // Cek apakah butuh login
  if (config.firebaseConfig?.enabled && !user) {
    return <Login config={config} />;
  }

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

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} config={config} setConfig={setConfig} isSyncing={isSyncing}>
      {renderContent()}
    </Layout>
  );
};

export default App;
