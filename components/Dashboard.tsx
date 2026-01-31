
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  MapPin,
  Home,
  Layers,
  X,
  TrendingUp,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Cell
} from 'recharts';
import { Resident } from '../types';
import { calculateAge } from '../utils/helpers';

interface DashboardProps {
  residents: Resident[];
}

interface DrillDownState {
  title: string;
  data: { label: string; value: number }[];
}

const AGE_BINS = [
  { min: 0, max: 1, label: '0-1 Bayi', sub: 'Bayi' },
  { min: 2, max: 5, label: '1-5 Balita', sub: 'Balita' },
  { min: 6, max: 12, label: '6-12 Anak', sub: 'Anak' },
  { min: 13, max: 18, label: '13-18 Remaja', sub: 'Remaja' },
  { min: 19, max: 30, label: '19-30 Dewasa', sub: 'Dewasa' },
  { min: 31, max: 45, label: '31-45 Prod', sub: 'Produktif' },
  { min: 46, max: 59, label: '46-59 Pra', sub: 'Pra Lansia' },
  { min: 60, max: 150, label: '60+ Lansia', sub: 'Lansia' }
];

const Dashboard: React.FC<DashboardProps> = ({ residents }) => {
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);

  const totalResidents = residents.length;
  const totalKK = useMemo(() => new Set(residents.map(r => r.noKK)).size, [residents]);
  const totalRT = useMemo(() => new Set(residents.map(r => `${r.dusun}-${r.rt}`)).size, [residents]);
  const totalDusun = useMemo(() => new Set(residents.map(r => r.dusun)).size, [residents]);

  const pyramidData = useMemo(() => {
    return AGE_BINS.map(bin => {
      const groupResidents = residents.filter(r => {
        const age = calculateAge(r.birthDate);
        return age >= bin.min && age <= bin.max;
      });
      const males = groupResidents.filter(r => r.gender.includes('Laki')).length;
      const females = groupResidents.filter(r => r.gender.includes('Perempuan')).length;
      return { ...bin, males, females: -females, displayFemales: females };
    }).reverse();
  }, [residents]);

  const handlePyramidClick = (data: any, gender: 'Laki' | 'Perempuan') => {
    if (!data) return;
    const ageLabel = data.label;
    const bin = AGE_BINS.find(b => b.label === ageLabel);
    if (!bin) return;

    const filtered = residents.filter(r => {
      const age = calculateAge(r.birthDate);
      return age >= bin.min && age <= bin.max && r.gender.includes(gender);
    });

    const counts = filtered.reduce((acc, r) => {
      acc[r.dusun] = (acc[r.dusun] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setDrillDown({
      title: `${gender === 'Laki' ? 'Pria' : 'Wanita'} Kelompok ${ageLabel} per Dusun`,
      data: Object.entries(counts).map(([label, value]) => ({ label, value: value as number })).sort((a, b) => b.value - a.value)
    });
  };

  const dusunChartData = useMemo(() => {
    const counts = residents.reduce((acc, r) => {
      acc[r.dusun] = (acc[r.dusun] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, count]) => ({ name, count: count as number })).sort((a, b) => b.count - a.count);
  }, [residents]);

  const StatCard = ({ icon: Icon, label, value, colorClass }: any) => (
    <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center space-x-4 shadow-sm transition-all">
      <div className={`p-3 md:p-4 rounded-2xl ${colorClass} shrink-0`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard icon={Users} label="Penduduk" value={totalResidents} colorClass="bg-blue-600" />
        <StatCard icon={Home} label="Kepala KK" value={totalKK} colorClass="bg-slate-900 dark:bg-slate-800" />
        <StatCard icon={Layers} label="Unit RT" value={totalRT} colorClass="bg-emerald-600" />
        <StatCard icon={MapPin} label="Dusun" value={totalDusun} colorClass="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center space-x-3">
               <TrendingUp size={20} className="text-blue-600" />
               <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">Piramida Penduduk</h3>
             </div>
             <div className="flex items-center space-x-3 text-[10px] font-bold uppercase text-slate-500">
                <div className="flex items-center"><div className="w-2.5 h-2.5 bg-pink-500 rounded-full mr-1.5"></div> Wanita</div>
                <div className="flex items-center"><div className="w-2.5 h-2.5 bg-blue-600 rounded-full mr-1.5"></div> Pria</div>
             </div>
          </div>
          <div className="h-[400px] md:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pyramidData} layout="vertical" stackOffset="sign" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis dataKey="label" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl text-[10px] uppercase font-black shadow-2xl border border-slate-800">
                        <p className="text-slate-400 mb-1 border-b border-slate-800 pb-1">{data.label}</p>
                        <p className="text-blue-400">Pria: {data.males} Jiwa</p>
                        <p className="text-pink-400">Wanita: {data.displayFemales} Jiwa</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar dataKey="females" fill="#db2777" radius={[5, 0, 0, 5]} barSize={20} className="cursor-pointer" onClick={(data) => handlePyramidClick(data, 'Perempuan')} />
                <Bar dataKey="males" fill="#1e40af" radius={[0, 5, 5, 0]} barSize={20} className="cursor-pointer" onClick={(data) => handlePyramidClick(data, 'Laki')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
           <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase mb-8 tracking-widest flex items-center">
              <MapPin size={18} className="mr-2 text-emerald-500" /> Sebaran Wilayah
           </h3>
           <div className="space-y-4">
              {dusunChartData.map((d) => (
                 <div key={d.name} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl group transition-all">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">{d.name}</span>
                       <span className="text-sm font-black text-slate-900 dark:text-white">{d.count} <span className="text-[10px] text-slate-400 font-normal">Jiwa</span></span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(d.count / (totalResidents || 1)) * 100}%` }}></div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
