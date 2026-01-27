
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PopulationManagement from './components/PopulationManagement';
import RecapIndicators from './components/RecapIndicators';
import AppSettings from './components/AppSettings';
import ArchivedResidents from './components/ArchivedResidents';
import BirthManagement from './components/BirthManagement';
import PregnancyManagement from './components/PregnancyManagement';
import { Resident, AppConfig } from './types';
import { initialResidents } from './mockData';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, collection, writeBatch } from 'firebase/firestore';

const App: React.FC = () => {
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
      firebaseConfig: { enabled: false }
    };
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const isRemoteUpdate = useRef(false);

  // Initialize Firebase and Handle Real-time Sync
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !config.firebaseConfig.projectId) return;

    try {
      const firebaseApp = getApps().length === 0 ? initializeApp({
        apiKey: config.firebaseConfig.apiKey,
        authDomain: config.firebaseConfig.authDomain,
        projectId: config.firebaseConfig.projectId,
        storageBucket: config.firebaseConfig.storageBucket,
        messagingSenderId: config.firebaseConfig.messagingSenderId,
        appId: config.firebaseConfig.appId
      }) : getApp();

      const db = getFirestore(firebaseApp);
      
      // Listen to Remote Changes
      const unsubscribe = onSnapshot(doc(db, "ngumbul_data", "residents_master"), (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data().list || [];
          isRemoteUpdate.current = true;
          setResidents(remoteData);
          localStorage.setItem('siga_residents', JSON.stringify(remoteData));
          setTimeout(() => { isRemoteUpdate.current = false; }, 500);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase Sync Error:", error);
    }
  }, [config.firebaseConfig?.enabled, config.firebaseConfig?.projectId]);

  // Sync Local Changes to Remote
  useEffect(() => {
    localStorage.setItem('siga_residents', JSON.stringify(residents));
    
    if (config.firebaseConfig?.enabled && config.firebaseConfig.projectId && !isRemoteUpdate.current) {
      const syncToCloud = async () => {
        setIsSyncing(true);
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp);
          await setDoc(doc(db, "ngumbul_data", "residents_master"), { 
            list: residents,
            lastUpdated: new Date().toISOString(),
            updatedBy: config.operatorName
          });
        } catch (e) {
          console.error("Gagal sinkron ke cloud:", e);
        } finally {
          setTimeout(() => setIsSyncing(false), 1000);
        }
      };
      
      const debounceTimer = setTimeout(syncToCloud, 2000);
      return () => clearTimeout(debounceTimer);
    }
  }, [residents]);

  useEffect(() => {
    localStorage.setItem('siga_config', JSON.stringify(config));
  }, [config]);

  const renderContent = () => {
    const activeResidents = residents.filter(r => r.status === 'Aktif');
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard residents={activeResidents} />;
      case 'penduduk':
        return <PopulationManagement residents={residents} setResidents={setResidents} config={config} />;
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
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} config={config} isSyncing={isSyncing}>
      {renderContent()}
    </Layout>
  );
};

export default App;
