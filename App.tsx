
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
  
  // Refs untuk manajemen alur data yang presisi
  const isInitialLoadDone = useRef(false);
  const isWritingToCloud = useRef(false);
  const lastKnownCloudTimestamp = useRef<string | null>(null);

  // Sync Theme dengan HTML Root
  useEffect(() => {
    const root = window.document.documentElement;
    if (config.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [config.theme]);

  // 1. Setup Firebase Listener (DOWNLOAD)
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !config.firebaseConfig.projectId) {
      isInitialLoadDone.current = true;
      return;
    }

    let unsubRes = () => {};
    let unsubConf = () => {};

    try {
      const firebaseApp = getApps().length === 0 ? initializeApp(config.firebaseConfig) : getApp();
      const db = getFirestore(firebaseApp);
      
      unsubRes = onSnapshot(doc(db, "ngumbul_data", "residents_master"), (snap) => {
        // JANGAN TIMPA jika kita sedang dalam proses menulis atau data berasal dari internal cache (pending writes)
        if (snap.metadata.hasPendingWrites || isWritingToCloud.current) return;

        if (snap.exists()) {
          const data = snap.data();
          // Validasi apakah data di cloud memang lebih baru atau berbeda dari yang kita tahu
          if (data.lastUpdated !== lastKnownCloudTimestamp.current) {
            lastKnownCloudTimestamp.current = data.lastUpdated;
            const cloudList = data.list || [];
            
            // Update state hanya jika ada perbedaan data (mencegah loop)
            setResidents(cloudList);
            localStorage.setItem('siga_residents', JSON.stringify(cloudList));
          }
        } else {
          // Jika dokumen belum ada di cloud, kita tandai load selesai agar bisa upload data lokal yang ada
          console.log("Cloud storage empty, ready for first upload.");
        }
        isInitialLoadDone.current = true;
      }, (err) => {
        console.error("Firebase Sync Error:", err);
        isInitialLoadDone.current = true;
      });

      unsubConf = onSnapshot(doc(db, "ngumbul_data", "app_config"), (snap) => {
        if (snap.metadata.hasPendingWrites || isWritingToCloud.current) return;
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
      console.error("Firebase Connection Error:", e);
      isInitialLoadDone.current = true;
    }

    return () => { unsubRes(); unsubConf(); };
  }, [config.firebaseConfig?.enabled, config.firebaseConfig?.projectId]);

  // 2. Upload Data ke Cloud (UPLOAD)
  useEffect(() => {
    // Simpan ke lokal selalu
    localStorage.setItem('siga_residents', JSON.stringify(residents));
    
    // GUARD: Cegah upload jika load awal belum selesai atau Firebase tidak aktif
    if (!isInitialLoadDone.current || !config.firebaseConfig?.enabled || !config.firebaseConfig.projectId) return;

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      isWritingToCloud.current = true; // Kunci listener download

      try {
        const db = getFirestore(getApp());
        const ts = new Date().toISOString();
        
        // Catat timestamp yang akan kita kirim agar listener tahu ini data kita
        lastKnownCloudTimestamp.current = ts;

        await setDoc(doc(db, "ngumbul_data", "residents_master"), { 
          list: residents,
          lastUpdated: ts
        });
        
        console.log("Cloud sync successful at", ts);
      } catch (e) { 
        console.error("Upload failed:", e); 
      } finally {
        // Berikan jeda kecil sebelum membuka kunci agar metadata snap sempat diproses
        setTimeout(() => {
          isWritingToCloud.current = false;
          setIsSyncing(false);
        }, 1000);
      }
    }, 2000); // Debounce 2 detik (sangat penting untuk import massal)

    return () => clearTimeout(timer);
  }, [residents]);

  // 3. Upload Config (Hanya parameter publik)
  useEffect(() => {
    if (!isInitialLoadDone.current || !config.firebaseConfig?.enabled || !config.firebaseConfig.projectId) return;
    
    const timer = setTimeout(async () => {
      try {
        const db = getFirestore(getApp());
        const { firebaseConfig, ...publicConfig } = config;
        await setDoc(doc(db, "ngumbul_data", "app_config"), { 
          ...publicConfig,
          lastUpdated: new Date().toISOString()
        });
      } catch (e) { console.error(e); }
    }, 1500);
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
