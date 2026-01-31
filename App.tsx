
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
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const App: React.FC = () => {
  // Ambil data awal dari localStorage saja, JANGAN pakai initialResidents jika ada cache
  const [residents, setResidents] = useState<Resident[]>(() => {
    const saved = localStorage.getItem('siga_residents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    }
    return [];
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
  
  // GUARD: Kunci utama agar tidak terjadi "Wiping"
  const isHydrated = useRef(false); // Menandai sudah sukses tarik data awal dari Cloud
  const isInternalUpdate = useRef(false); // Menandai perubahan state berasal dari Cloud listener
  const lastUpdateToken = useRef<string | null>(null);

  // Sync Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (config.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [config.theme]);

  // 1. Firebase Listener (DOWNLOAD)
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !config.firebaseConfig.projectId) {
      isHydrated.current = true; // Mode lokal, langsung anggap siap
      return;
    }

    let unsubRes = () => {};
    let unsubConf = () => {};

    try {
      const firebaseApp = getApps().length === 0 ? initializeApp(config.firebaseConfig) : getApp();
      const db = getFirestore(firebaseApp);
      
      unsubRes = onSnapshot(doc(db, "ngumbul_data", "residents_master"), (snap) => {
        // Jika data ini berasal dari upload kita sendiri (metadata pending), abaikan
        if (snap.metadata.hasPendingWrites) return;

        if (snap.exists()) {
          const cloudData = snap.data();
          if (cloudData.lastUpdated !== lastUpdateToken.current) {
            lastUpdateToken.current = cloudData.lastUpdated;
            
            // Tandai ini update internal agar useEffect upload tidak terpicu
            isInternalUpdate.current = true;
            setResidents(cloudData.list || []);
            localStorage.setItem('siga_residents', JSON.stringify(cloudData.list || []));
          }
        } else {
          console.log("Cloud masih kosong. Menunggu upload pertama...");
        }
        
        // Tandai bursa data sudah sinkron, kunci upload dibuka
        isHydrated.current = true;
      }, (err) => {
        console.error("Cloud Listener Error:", err);
        isHydrated.current = true;
      });

      unsubConf = onSnapshot(doc(db, "ngumbul_data", "app_config"), (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          setConfig(prev => {
            const newConf = { ...prev, ...data, firebaseConfig: prev.firebaseConfig };
            localStorage.setItem('siga_config', JSON.stringify(newConf));
            return newConf;
          });
        }
      });

    } catch (e) {
      console.error("Firebase Init Error:", e);
      isHydrated.current = true;
    }

    return () => { unsubRes(); unsubConf(); };
  }, [config.firebaseConfig?.enabled, config.firebaseConfig?.projectId]);

  // 2. Firebase Sync (UPLOAD)
  useEffect(() => {
    // Simpan ke lokal selalu sebagai backup tercepat
    localStorage.setItem('siga_residents', JSON.stringify(residents));

    // PROTEKSI 1: Jika belum selesai tarik data awal, JANGAN upload (mencegah timpa 0)
    if (!isHydrated.current) return;

    // PROTEKSI 2: Jika perubahan state berasal dari download (onSnapshot), JANGAN upload balik
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    if (config.firebaseConfig?.enabled && config.firebaseConfig.projectId) {
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
          console.log("Berhasil Sinkron ke Cloud:", residents.length, "jiwa");
        } catch (e) {
          console.error("Gagal Sinkron ke Cloud:", e);
        } finally {
          setIsSyncing(false);
        }
      }, 2500); // Debounce lebih lama (2.5 detik) agar stabil setelah import massal
      return () => clearTimeout(timer);
    }
  }, [residents]);

  // 3. Sync Config
  useEffect(() => {
    if (!isHydrated.current || !config.firebaseConfig?.enabled) return;
    const timer = setTimeout(async () => {
      try {
        const db = getFirestore(getApp());
        const { firebaseConfig, ...publicConfig } = config;
        await setDoc(doc(db, "ngumbul_data", "app_config"), { 
          ...publicConfig,
          lastUpdated: new Date().toISOString()
        });
      } catch (e) {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [config]);

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
      case 'profil': return <AppSettings config={config} setConfig={setConfig} />;
      default: return <Dashboard residents={activeResidents} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      config={config} 
      setConfig={setConfig}
      isSyncing={isSyncing}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
