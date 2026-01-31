
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
import { getFirestore, collection, doc, writeBatch, getDocs, onSnapshot, query, limit } from 'firebase/firestore';
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
  const syncTimeoutRef = useRef<any>(null);

  // 0. Simpan Config ke LocalStorage
  useEffect(() => {
    localStorage.setItem('siga_config', JSON.stringify(config));
    const root = window.document.documentElement;
    if (config.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [config]);

  // 1. Firebase Auth Listener
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !config.firebaseConfig.projectId) {
      setAuthLoading(false);
      setUser(null);
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

  // 2. Firebase Realtime Listener (COLLECTION MODE)
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !config.firebaseConfig.projectId || !user) {
      isHydrated.current = true;
      return;
    }

    let unsubRes = () => {};
    try {
      const db = getFirestore(getApp());
      // Kita mendengarkan perubahan pada seluruh koleksi "residents_db"
      unsubRes = onSnapshot(collection(db, "residents_db"), (snap) => {
        // Jangan update jika perubahan berasal dari diri sendiri (pending writes)
        if (snap.metadata.hasPendingWrites) return;

        // Jika ada perubahan di Cloud, ambil semua data terbaru
        const cloudList: Resident[] = [];
        snap.forEach((doc) => {
          cloudList.push(doc.data() as Resident);
        });

        // Pengamanan: Hanya timpa jika cloud tidak kosong atau ini sinkronisasi pertama
        if (cloudList.length > 0 || residents.length === 0) {
          isInternalUpdate.current = true;
          setResidents(cloudList);
          localStorage.setItem('siga_residents', JSON.stringify(cloudList));
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

  // 3. Auto-Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('siga_residents', JSON.stringify(residents));
  }, [residents]);

  const forcePush = async () => {
    if (!config.firebaseConfig?.enabled || !user) return alert("Firebase belum aktif atau belum login.");
    setIsSyncing(true);
    try {
      const db = getFirestore(getApp());
      
      // Menggunakan BATCH (Maksimal 500 per kiriman)
      let batch = writeBatch(db);
      let count = 0;
      
      for (const res of residents) {
        const docRef = doc(db, "residents_db", res.id);
        batch.set(docRef, res);
        count++;
        
        // Jika sudah 500, kirim dulu lalu buat batch baru
        if (count % 500 === 0) {
          await batch.commit();
          batch = writeBatch(db);
        }
      }
      
      // Kirim sisanya
      if (count % 500 !== 0) {
        await batch.commit();
      }

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
      const db = getFirestore(getApp());
      const querySnapshot = await getDocs(collection(db, "residents_db"));
      const cloudList: Resident[] = [];
      querySnapshot.forEach((doc) => {
        cloudList.push(doc.data() as Resident);
      });

      if (cloudList.length > 0) {
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
