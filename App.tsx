
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
  // Inisialisasi State
  const [residents, setResidents] = useState<Resident[]>(() => {
    const saved = localStorage.getItem('siga_residents');
    return saved ? JSON.parse(saved) : initialResidents;
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
  
  // Refs untuk manajemen sinkronisasi
  const skipNextResidentSync = useRef(false);
  const isInitialCloudLoadResident = useRef(false);
  const isInitialCloudLoadConfig = useRef(false);
  const lastCloudResidentUpdate = useRef<string | null>(null);
  const lastCloudConfigUpdate = useRef<string | null>(null);

  // Sync Theme with Document Root
  useEffect(() => {
    const root = window.document.documentElement;
    if (config.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [config.theme]);

  // 1. Setup Firebase Listeners
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !config.firebaseConfig.projectId) {
      // Jika mode lokal, anggap load selesai agar bisa simpan ke localstorage
      isInitialCloudLoadResident.current = true;
      isInitialCloudLoadConfig.current = true;
      return;
    }

    let unsubRes = () => {};
    let unsubConf = () => {};

    try {
      const firebaseApp = getApps().length === 0 
        ? initializeApp(config.firebaseConfig) 
        : getApp();
      const db = getFirestore(firebaseApp);
      
      // Listener Data Penduduk
      unsubRes = onSnapshot(doc(db, "ngumbul_data", "residents_master"), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.lastUpdated !== lastCloudResidentUpdate.current) {
            lastCloudResidentUpdate.current = data.lastUpdated;
            skipNextResidentSync.current = true;
            setResidents(data.list || []);
            localStorage.setItem('siga_residents', JSON.stringify(data.list || []));
          }
        }
        // Tandai bahwa kita sudah mendengar dari Cloud pertama kali
        isInitialCloudLoadResident.current = true;
      }, (err) => {
        console.error("Cloud error, falling back to local:", err);
        isInitialCloudLoadResident.current = true;
      });

      // Listener Konfigurasi
      unsubConf = onSnapshot(doc(db, "ngumbul_data", "app_config"), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.lastUpdated !== lastCloudConfigUpdate.current) {
            lastCloudConfigUpdate.current = data.lastUpdated;
            setConfig(prev => {
              const newConf = { ...prev, ...data, firebaseConfig: prev.firebaseConfig, theme: data.theme || prev.theme };
              localStorage.setItem('siga_config', JSON.stringify(newConf));
              return newConf;
            });
          }
        }
        isInitialCloudLoadConfig.current = true;
      }, () => {
        isInitialCloudLoadConfig.current = true;
      });

    } catch (e) {
      console.error("Firebase Connection Error:", e);
      isInitialCloudLoadResident.current = true;
      isInitialCloudLoadConfig.current = true;
    }

    return () => { unsubRes(); unsubConf(); };
  }, [config.firebaseConfig?.enabled, config.firebaseConfig?.projectId]);

  // 2. Sync Residents to Cloud
  useEffect(() => {
    localStorage.setItem('siga_residents', JSON.stringify(residents));
    
    // GUARD: Jangan upload jika Firebase aktif tapi kita belum selesai narik data awal dari Cloud
    if (!isInitialCloudLoadResident.current) return;

    if (config.firebaseConfig?.enabled && config.firebaseConfig.projectId) {
      if (skipNextResidentSync.current) {
        skipNextResidentSync.current = false;
        return;
      }

      const timer = setTimeout(async () => {
        setIsSyncing(true);
        try {
          const db = getFirestore(getApp());
          const ts = new Date().toISOString();
          lastCloudResidentUpdate.current = ts;
          await setDoc(doc(db, "ngumbul_data", "residents_master"), { 
            list: residents,
            lastUpdated: ts
          });
        } catch (e) { console.error("Upload Error:", e); }
        finally { setTimeout(() => setIsSyncing(false), 500); }
      }, 2000); // Debounce lebih lama untuk memastikan kestabilan
      return () => clearTimeout(timer);
    }
  }, [residents]);

  // 3. Sync Config to Cloud
  useEffect(() => {
    if (!isInitialCloudLoadConfig.current) return;

    if (config.firebaseConfig?.enabled && config.firebaseConfig.projectId) {
      const timer = setTimeout(async () => {
        try {
          const db = getFirestore(getApp());
          const ts = new Date().toISOString();
          lastCloudConfigUpdate.current = ts;
          const { firebaseConfig, ...publicConfig } = config;
          await setDoc(doc(db, "ngumbul_data", "app_config"), { 
            ...publicConfig,
            lastUpdated: ts
          });
        } catch (e) { console.error(e); }
      }, 1000);
      return () => clearTimeout(timer);
    }
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
