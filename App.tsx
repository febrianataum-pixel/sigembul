
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
import { Resident, AppConfig } from './types';
import { initialResidents } from './mockData';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

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

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const isHydrated = useRef(false); 
  const isInternalUpdate = useRef(false);
  const lastUpdateToken = useRef<string | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (config.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [config.theme]);

  // 1. Firebase Listener (DOWNLOAD)
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !config.firebaseConfig.projectId) {
      isHydrated.current = true;
      return;
    }

    let unsubRes = () => {};
    try {
      const firebaseApp = getApps().length === 0 ? initializeApp(config.firebaseConfig) : getApp();
      const db = getFirestore(firebaseApp);
      
      unsubRes = onSnapshot(doc(db, "ngumbul_data", "residents_master"), (snap) => {
        if (snap.metadata.hasPendingWrites) return;

        if (snap.exists()) {
          const cloudData = snap.data();
          // Jika data di cloud ada isinya, dan berbeda dengan lokal
          if (cloudData.lastUpdated !== lastUpdateToken.current) {
            lastUpdateToken.current = cloudData.lastUpdated;
            const cloudList = cloudData.list || [];
            
            // ANTI-WIPE: Hanya timpa lokal jika cloud benar-benar punya data atau memang kita mau kosongkan
            // Tapi jika cloud kosong dan lokal ada isinya (kasus browser baru), 
            // kita jangan set isHydrated dulu sampai kita putuskan siapa yang menang.
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
  }, [config.firebaseConfig?.enabled, config.firebaseConfig?.projectId]);

  // 2. Firebase Sync (UPLOAD)
  useEffect(() => {
    localStorage.setItem('siga_residents', JSON.stringify(residents));

    if (!isHydrated.current) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    if (config.firebaseConfig?.enabled && config.firebaseConfig.projectId) {
      // JANGAN upload data kosong jika kita baru saja buka aplikasi (proteksi browser baru)
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
  }, [residents]);

  // Manual Cloud Actions
  const forcePush = async () => {
    if (!config.firebaseConfig?.enabled) return;
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
    if (!config.firebaseConfig?.enabled) return;
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
      case 'profil': return <AppSettings config={config} setConfig={setConfig} onForcePush={forcePush} onForcePull={forcePull} />;
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
