
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
import { getFirestore, collection, doc, writeBatch, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
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

  // 2. Firebase Realtime Listener (MERGE MODE)
  useEffect(() => {
    if (!config.firebaseConfig?.enabled || !config.firebaseConfig.projectId || !user) {
      isHydrated.current = true;
      return;
    }

    let unsubRes = () => {};
    try {
      const db = getFirestore(getApp());
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
        const db = getFirestore(getApp());
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
      const db = getFirestore(getApp());
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
      const db = getFirestore(getApp());
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
      const auth = getAuth(getApp());
      await signOut(auth);
      setUser(null);
    } catch (e) {
      alert("Gagal Keluar");
    }
  };

  // Skip rendering auth loading screen to make access immediate
  // if (authLoading) { ... }

  // LOGIN SCREEN TEMPORARILY HIDDEN BY REQUEST
  /*
  if (config.firebaseConfig?.enabled && !user) {
    return <Login config={config} />;
  }
  */

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
