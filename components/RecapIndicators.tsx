
import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  GraduationCap, 
  Briefcase, 
  Calendar, 
  Heart, 
  MapPin, 
  UserCircle,
  ArrowLeft,
  X,
  Users,
  Search,
  Filter,
  Printer,
  FileText,
  HeartPulse
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Resident, AppConfig } from '../types';
import { calculateAge, getAgeGroup, formatDate } from '../utils/helpers';

interface RecapIndicatorsProps {
  residents: Resident[];
  config: AppConfig;
}

const INDICATORS_CONFIG = [
  { id: 'pendidikan', label: 'Pendidikan', icon: GraduationCap, color: 'bg-blue-500', key: 'education' },
  { id: 'pekerjaan', label: 'Pekerjaan', icon: Briefcase, color: 'bg-emerald-500', key: 'job' },
  { id: 'usia', label: 'Usia', icon: Calendar, color: 'bg-amber-500', key: 'ageGroup' },
  { id: 'gender', label: 'Gender', icon: UserCircle, color: 'bg-indigo-500', key: 'gender' },
  { id: 'perkawinan', label: 'Kawin', icon: Heart, color: 'bg-pink-500', key: 'maritalStatus' },
  { id: 'wilayah', label: 'Wilayah', icon: MapPin, color: 'bg-slate-700', key: 'dusun' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#1e293b'];

const RecapIndicators: React.FC<RecapIndicatorsProps> = ({ residents = [], config }) => {
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [dusunFilter, setDusunFilter] = useState<string>('');
  const [selectedBNBA, setSelectedBNBA] = useState<{ label: string, categoryKey: string, categoryValue: string } | null>(null);
  const [bnbaSearch, setBnbaSearch] = useState('');

  const dusunList = useMemo(() => Array.from(new Set(residents.map(r => r.dusun))).sort(), [residents]);
  const filteredForChart = useMemo(() => dusunFilter ? residents.filter(r => r.dusun === dusunFilter) : residents, [residents, dusunFilter]);
  const totalPregnant = useMemo(() => filteredForChart.filter(r => r.isPregnant).length, [filteredForChart]);

  const getRecapData = (key: string) => {
    const counts = filteredForChart.reduce((acc, r) => {
      let val: string = 'N/A';
      if (key === 'ageGroup') val = getAgeGroup(calculateAge(r.birthDate));
      else val = String(r[key as keyof Resident] || 'N/A');
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .map(([name, value]): { name: string; value: number } => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  };

  const currentIndicatorData = useMemo(() => {
    if (!selectedIndicator) return [];
    const item = INDICATORS_CONFIG.find(i => i.id === selectedIndicator);
    return item ? getRecapData(item.key) : [];
  }, [selectedIndicator, filteredForChart]);

  const handleBarClick = (data: any) => {
    if (!data || !selectedIndicator) return;
    const item = INDICATORS_CONFIG.find(i => i.id === selectedIndicator);
    if (!item) return;
    setSelectedBNBA({ label: data.name, categoryKey: item.key, categoryValue: data.name });
    setBnbaSearch('');
  };

  const bnbaList = useMemo(() => {
    if (!selectedBNBA) return [];
    let baseList = filteredForChart.filter(r => {
      if (selectedBNBA.categoryKey === 'ageGroup') return getAgeGroup(calculateAge(r.birthDate)) === selectedBNBA.categoryValue;
      return String(r[selectedBNBA.categoryKey as keyof Resident]) === selectedBNBA.categoryValue;
    });
    if (bnbaSearch) {
      const s = bnbaSearch.toLowerCase();
      baseList = baseList.filter(r => r.fullName.toLowerCase().includes(s) || r.nik.includes(s));
    }
    return baseList.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [selectedBNBA, filteredForChart, bnbaSearch]);

  if (!selectedIndicator) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-3xl flex items-center justify-center">
                 <HeartPulse size={32} />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Indikator Ibu Hamil</h2>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Data KIA (Kesehatan Ibu dan Anak)</p>
              </div>
           </div>
           <div className="bg-pink-50 dark:bg-pink-950/20 px-10 py-5 rounded-3xl text-center border border-pink-100 dark:border-pink-900/30">
              <span className="text-3xl font-black text-pink-600 dark:text-pink-400 block">{totalPregnant}</span>
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest mt-1 block">Ibu Hamil Aktif</span>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {INDICATORS_CONFIG.map((item) => (
            <button key={item.id} onClick={() => setSelectedIndicator(item.id)} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-4 transition-all hover:scale-[1.03] group">
              <div className={`${item.color} text-white p-6 rounded-2xl group-hover:scale-110 transition-transform shadow-lg`}>
                <item.icon size={28} />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{item.label}</h3>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button onClick={() => setSelectedIndicator(null)} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-slate-600 dark:text-slate-400 transition-all">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white">{INDICATORS_CONFIG.find(i => i.id === selectedIndicator)?.label}</h2>
        </div>
        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
           <Filter size={14} className="text-slate-400" />
           <select className="bg-transparent text-xs font-black uppercase outline-none dark:text-white" value={dusunFilter} onChange={(e) => setDusunFilter(e.target.value)}>
             <option value="" className="dark:bg-slate-800">Seluruh Desa</option>
             {dusunList.map(d => <option key={d} value={d} className="dark:bg-slate-800">{d}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
         <div className="h-[400px] md:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={currentIndicatorData} layout="vertical" margin={{ left: -10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#1e293b', opacity: 0.1 }} content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl text-[10px] font-black uppercase">{payload[0].payload.name}: <span className="text-emerald-400">{payload[0].value} Jiwa</span></div>;
                    }
                    return null;
                  }} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24} className="cursor-pointer" onClick={(data) => handleBarClick(data)}>
                    {currentIndicatorData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      {selectedBNBA && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
              <div className="p-8 bg-slate-950 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg"><Users size={24} /></div>
                    <div>
                       <h4 className="text-base font-black uppercase tracking-widest">BNBA: {selectedBNBA.label}</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{bnbaList.length} Jiwa Ditemukan</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedBNBA(null)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                 <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3">
                       <Search size={18} className="text-slate-400 mr-3" />
                       <input type="text" placeholder="Cari nama dalam daftar ini..." className="bg-transparent text-sm font-bold outline-none w-full dark:text-white" value={bnbaSearch} onChange={(e) => setBnbaSearch(e.target.value)} />
                    </div>
                 </div>
                 <div className="flex-1 overflow-auto p-8 bg-slate-50/30 dark:bg-slate-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {bnbaList.map((r, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-4">
                             <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">{idx + 1}</div>
                             <div className="min-w-0 flex-1">
                                <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{r.fullName}</h5>
                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{r.dusun} | RT {r.rt}</div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center shrink-0">
                 <button onClick={() => setSelectedBNBA(null)} className="px-12 py-4 bg-slate-950 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all">Tutup BNBA</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RecapIndicators;
