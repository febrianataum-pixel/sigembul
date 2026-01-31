
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
  // Ambil dari localStorage hanya untuk inisialisasi awal (fast load)
  const [residents, setResidents] = useState<Resident[]>(() => {
    const saved = localStorage.getItem('siga_residents');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialResidents;
      }
    }
    return initialResidents;
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('siga_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          appName: 'SIGA Ngumbul',
          subtitle: 'Kec. Todanan, Kab. Blora',
          logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Lambang_Kabupaten_Blora.png',
          operatorName: 'ADMIN DESA',
          villageHeadName: 'SULARNO',
          theme: 'light',
          firebaseConfig: { enabled: false }
        } as AppConfig;
      }
    }
    return {
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
  
  // Ref untuk mendeteksi apakah perubahan state berasal dari Cloud (onSnapshot)
  const skipNextResidentSync = useRef(false);
  const skipNextConfigSync = useRef(false);
  const lastCloudResidentUpdate = useRef<string | null>(null);
  const lastCloudConfigUpdate = useRef<string | null>(null);

  // 1. Inisialisasi Firebase & Listener Real-time
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !config.firebaseConfig.projectId) return;

    let unsubscribeResidents = () => {};
    let unsubscribeConfig = () => {};

    try {
      const firebaseApp = getApps().length === 0 
        ? initializeApp({
            apiKey: config.firebaseConfig.apiKey,
            authDomain: config.firebaseConfig.authDomain,
            projectId: config.firebaseConfig.projectId,
            storageBucket: config.firebaseConfig.storageBucket,
            messagingSenderId: config.firebaseConfig.messagingSenderId,
            appId: config.firebaseConfig.appId
          }) 
        : getApp();

      const db = getFirestore(firebaseApp);
      
      // Listen Resident Master
      const resDocRef = doc(db, "ngumbul_data", "residents_master");
      unsubscribeResidents = onSnapshot(resDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const remoteList = data.list || [];
          const updateId = data.lastUpdated;

          if (updateId !== lastCloudResidentUpdate.current) {
            console.log("☁️ Sync: Data Penduduk diterima...");
            lastCloudResidentUpdate.current = updateId;
            skipNextResidentSync.current = true;
            setResidents(remoteList);
            localStorage.setItem('siga_residents', JSON.stringify(remoteList));
          }
        }
      });

      // Listen Config (termasuk Theme)
      const confDocRef = doc(db, "ngumbul_data", "app_config");
      unsubscribeConfig = onSnapshot(confDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as AppConfig & { lastUpdated?: string };
          const updateId = data.lastUpdated;

          if (updateId !== lastCloudConfigUpdate.current) {
            console.log("☁️ Sync: Konfigurasi/Tema diterima...");
            lastCloudConfigUpdate.current = updateId;
            skipNextConfigSync.current = true;
            
            // Gabungkan remote config dengan local firebase config agar tidak terputus koneksi lokalnya
            const mergedConfig: AppConfig = {
              ...data,
              firebaseConfig: config.firebaseConfig // Tetap gunakan setting lokal untuk kredensial Firebase
            };
            setConfig(mergedConfig);
            localStorage.setItem('siga_config', JSON.stringify(mergedConfig));
          }
        }
      });

    } catch (error) {
      console.error("Firebase Sync Initialization Error:", error);
    }

    return () => {
      unsubscribeResidents();
      unsubscribeConfig();
    };
  }, [config.firebaseConfig?.enabled, config.firebaseConfig?.projectId]);

  // 2. Sinkronisasi Residents ke Cloud
  useEffect(() => {
    localStorage.setItem('siga_residents', JSON.stringify(residents));
    
    if (config.firebaseConfig?.enabled && config.firebaseConfig.projectId) {
      if (skipNextResidentSync.current) {
        skipNextResidentSync.current = false;
        return;
      }

      const syncToCloud = async () => {
        setIsSyncing(true);
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp);
          const updateTimestamp = new Date().toISOString();
          lastCloudResidentUpdate.current = updateTimestamp;

          await setDoc(doc(db, "ngumbul_data", "residents_master"), { 
            list: residents,
            lastUpdated: updateTimestamp,
            updatedBy: config.operatorName
          });
        } catch (e) {
          console.error("Sync Residents Error:", e);
        } finally {
          setTimeout(() => setIsSyncing(false), 800);
        }
      };
      
      const debounceTimer = setTimeout(syncToCloud, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [residents]);

  // 3. Sinkronisasi Config (Theme, dll) ke Cloud
  useEffect(() => {
    localStorage.setItem('siga_config', JSON.stringify(config));

    if (config.firebaseConfig?.enabled && config.firebaseConfig.projectId) {
      if (skipNextConfigSync.current) {
        skipNextConfigSync.current = false;
        return;
      }

      const syncConfigToCloud = async () => {
        setIsSyncing(true);
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp);
          const updateTimestamp = new Date().toISOString();
          lastCloudConfigUpdate.current = updateTimestamp;

          // Kita hanya kirim profil, bukan kredensial firebase sensitif
          const { firebaseConfig, ...publicConfig } = config;
          await setDoc(doc(db, "ngumbul_data", "app_config"), { 
            ...publicConfig,
            lastUpdated: updateTimestamp
          });
        } catch (e) {
          console.error("Sync Config Error:", e);
        } finally {
          setTimeout(() => setIsSyncing(false), 800);
        }
      };

      const debounceTimer = setTimeout(syncConfigToCloud, 1500);
      return () => clearTimeout(debounceTimer);
    }
  }, [config]);

  const renderContent = () => {
    const activeResidents = residents.filter(r => r.status === 'Aktif');
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard residents={activeResidents} />;
      case 'penduduk':
        return <PopulationManagement residents={residents} setResidents={setResidents} config={config} />;
      case 'pencarian':
        return <AdvancedSearch residents={activeResidents} setResidents={setResidents} config={config} />;
      case 'kelahiran':
        return <BirthManagement residents={residents} setResidents={setResidents} />;
      case 'kehamilan':
        return <PregnancyManagement residents={residents} setResidents={setResidents} />;
      case 'arsip':
        return <ArchivedResidents residents={residents} setResidents={setResidents} />;
      case 'rekap':
        return <RecapIndicators residents={activeResidents} config={config} />;
      case 'profil':
        return <AppSettings config={config} setConfig={setConfig} />;
      default:
        return <Dashboard residents={activeResidents} />;
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
