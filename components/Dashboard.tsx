
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
    <div className="bg-white dark:bg-slate-900 p-3 md:p-6 rounded-xl md:rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3 md:space-x-5 shadow-sm transition-all hover:scale-[1.02]">
      <div className={`p-2 md:p-4 rounded-lg md:rounded-2xl ${colorClass} shrink-0`}>
        <Icon size={16} className="md:w-6 md:h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-[7px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 truncate">{label}</p>
        <p className="text-base md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard icon={Users} label="Penduduk" value={totalResidents} colorClass="bg-blue-600 text-white" />
        <StatCard icon={Home} label="Kepala KK" value={totalKK} colorClass="bg-slate-900 dark:bg-blue-900/40 text-white" />
        <StatCard icon={Layers} label="Unit RT" value={totalRT} colorClass="bg-emerald-600 text-white" />
        <StatCard icon={MapPin} label="Dusun" value={totalDusun} colorClass="bg-amber-500 text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm relative">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center space-x-3">
               <TrendingUp size={16} className="text-blue-600" />
               <h3 className="text-[10px] md:text-base font-black text-slate-900 dark:text-white uppercase">Piramida Penduduk</h3>
             </div>
             <div className="flex items-center space-x-2 text-[7px] md:text-[9px] font-bold uppercase text-slate-500">
                <div className="flex items-center"><div className="w-2 h-2 bg-pink-500 rounded-full mr-1"></div> Wanita</div>
                <div className="flex items-center"><div className="w-2 h-2 bg-blue-600 rounded-full mr-1"></div> Pria</div>
             </div>
          </div>
          <div className="h-[350px] md:h-[550px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pyramidData} layout="vertical" stackOffset="sign" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="label" 
                  type="category" 
                  width={110} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} 
                />
                <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl text-[9px] uppercase font-black shadow-2xl border border-slate-800">
                        <p className="text-slate-400 mb-1 border-b border-slate-800 pb-1">{data.label}</p>
                        <p className="text-blue-400">Pria: {data.males} Jiwa</p>
                        <p className="text-pink-400">Wanita: {data.displayFemales} Jiwa</p>
                        <p className="mt-2 text-[7px] text-slate-500 italic">Klik bar untuk rincian dusun</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar 
                  dataKey="females" 
                  fill="#db2777" 
                  radius={[5, 0, 0, 5]} 
                  barSize={20} 
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(data) => handlePyramidClick(data, 'Perempuan')}
                />
                <Bar 
                  dataKey="males" 
                  fill="#1e40af" 
                  radius={[0, 5, 5, 0]} 
                  barSize={20} 
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(data) => handlePyramidClick(data, 'Laki')}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
           <h3 className="text-[10px] md:text-sm font-black text-slate-800 dark:text-white uppercase mb-6 tracking-widest flex items-center">
              <MapPin size={14} className="mr-2 text-emerald-500" /> Sebaran Wilayah
           </h3>
           <div className="space-y-3">
              {dusunChartData.map((d) => (
                 <div key={d.name} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-center mb-1.5">
                       <span className="text-[8px] md:text-xs font-black text-slate-700 dark:text-slate-300 uppercase">{d.name}</span>
                       <span className="text-[10px] md:text-sm font-black text-slate-900 dark:text-white">{d.count} <span className="text-[8px] text-slate-400 font-normal">Jiwa</span></span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                       <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(d.count / (totalResidents || 1)) * 100}%` }}></div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Drill Down Modal */}
      {drillDown && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <div className="p-6 bg-slate-950 text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Layers size={18} />
                   </div>
                   <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest">{drillDown.title}</h4>
                </div>
                <button onClick={() => setDrillDown(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-all">
                   <X size={20} />
                </button>
             </div>
             <div className="p-6 md:p-8 space-y-3 max-h-[60vh] overflow-y-auto">
                {drillDown.data.map((item, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{item.label}</span>
                      <div className="flex items-center space-x-2">
                         <span className="text-base font-black text-slate-900 dark:text-white">{item.value}</span>
                         <span className="text-[8px] font-black text-slate-400 uppercase">Jiwa</span>
                      </div>
                   </div>
                ))}
             </div>
             <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
                <button onClick={() => setDrillDown(null)} className="w-full py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-xl">Tutup</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
