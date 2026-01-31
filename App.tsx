
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
  
  // Ref untuk mendeteksi apakah perubahan state berasal dari Cloud (onSnapshot)
  // agar tidak dikirim balik ke Cloud (infinite loop / conflict)
  const skipNextSync = useRef(false);
  const lastCloudUpdate = useRef<string | null>(null);

  // 1. Inisialisasi Firebase & Listener Real-time
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !config.firebaseConfig.projectId) return;

    let unsubscribe = () => {};

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
      const docRef = doc(db, "ngumbul_data", "residents_master");
      
      console.log("🔥 Menyambungkan ke Cloud Firestore...");

      // Listen perubahan dari browser lain secara real-time
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const remoteList = data.list || [];
          const updateId = data.lastUpdated;

          // Jika data ini berbeda dengan yang kita miliki terakhir (berdasarkan timestamp)
          if (updateId !== lastCloudUpdate.current) {
            console.log("☁️ Menerima update data dari Cloud...");
            lastCloudUpdate.current = updateId;
            skipNextSync.current = true; // Jangan kirim data ini balik ke Cloud
            
            setResidents(remoteList);
            localStorage.setItem('siga_residents', JSON.stringify(remoteList));
          }
        }
      }, (error) => {
        console.error("Firebase Snapshot Error:", error);
      });

    } catch (error) {
      console.error("Firebase Initialization Error:", error);
    }

    return () => unsubscribe();
  }, [config.firebaseConfig?.enabled, config.firebaseConfig?.projectId]);

  // 2. Sinkronisasi Perubahan Lokal ke Cloud
  useEffect(() => {
    // Simpan ke localStorage tetap dilakukan tiap ada perubahan
    localStorage.setItem('siga_residents', JSON.stringify(residents));
    
    // Jika Cloud aktif dan perubahan BUKAN berasal dari onSnapshot (melainkan aksi user lokal)
    if (config.firebaseConfig?.enabled && config.firebaseConfig.projectId) {
      if (skipNextSync.current) {
        skipNextSync.current = false;
        return;
      }

      const syncToCloud = async () => {
        setIsSyncing(true);
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp);
          const updateTimestamp = new Date().toISOString();
          
          lastCloudUpdate.current = updateTimestamp;

          await setDoc(doc(db, "ngumbul_data", "residents_master"), { 
            list: residents,
            lastUpdated: updateTimestamp,
            updatedBy: config.operatorName
          });
          
          console.log("✅ Data berhasil disinkronkan ke Cloud.");
        } catch (e) {
          console.error("❌ Gagal sinkron ke cloud:", e);
        } finally {
          // Beri jeda visual sedikit agar user tahu proses selesai
          setTimeout(() => setIsSyncing(false), 800);
        }
      };
      
      // Debounce: Tunggu 1 detik setelah user berhenti mengubah data baru kirim ke Cloud
      const debounceTimer = setTimeout(syncToCloud, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [residents]);

  // Simpan config ke localStorage
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
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} config={config} isSyncing={isSyncing}>
      {renderContent()}
    </Layout>
  );
};

export default App;
