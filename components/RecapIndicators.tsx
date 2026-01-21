
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
  Eye,
  Download,
  Filter,
  Printer,
  FileText
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

  const dusunList = useMemo(() => 
    Array.from(new Set(residents.map(r => r.dusun))).sort()
  , [residents]);

  const filteredForChart = useMemo(() => {
    if (!dusunFilter) return residents;
    return residents.filter(r => r.dusun === dusunFilter);
  }, [residents, dusunFilter]);

  const getRecapData = (key: string) => {
    const counts = filteredForChart.reduce((acc, r) => {
      let val: string = 'N/A';
      if (key === 'ageGroup') val = getAgeGroup(calculateAge(r.birthDate));
      else val = String(r[key as keyof Resident] || 'N/A');
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Fixed: Explicitly cast value as number to resolve 'unknown' assignment error on line 76
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

    setSelectedBNBA({
      label: data.name,
      categoryKey: item.key,
      categoryValue: data.name
    });
    setBnbaSearch('');
  };

  const bnbaList = useMemo(() => {
    if (!selectedBNBA) return [];
    let baseList = filteredForChart.filter(r => {
      if (selectedBNBA.categoryKey === 'ageGroup') {
        return getAgeGroup(calculateAge(r.birthDate)) === selectedBNBA.categoryValue;
      }
      return String(r[selectedBNBA.categoryKey as keyof Resident]) === selectedBNBA.categoryValue;
    });

    if (bnbaSearch) {
      const s = bnbaSearch.toLowerCase();
      baseList = baseList.filter(r => 
        r.fullName.toLowerCase().includes(s) || r.nik.includes(s)
      );
    }

    return baseList.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [selectedBNBA, filteredForChart, bnbaSearch]);

  const handleDownloadBNBAPDF = () => {
    if (!selectedBNBA || bnbaList.length === 0) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PEMERINTAH KABUPATEN BLORA', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('KECAMATAN TODANAN - DESA NGUMBUL', 105, 21, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Alamat: Jl. Raya Todanan-Ngumbul KM. 05, Desa Ngumbul, Kec. Todanan, Kab. Blora (58256)', 105, 26, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(20, 28, 190, 28);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const indicatorLabel = INDICATORS_CONFIG.find(i => i.id === selectedIndicator)?.label || '';
    doc.text(`DAFTAR PENDUDUK (BNBA) - ${indicatorLabel.toUpperCase()}`, 105, 38, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`KATEGORI: ${selectedBNBA.label.toUpperCase()}`, 105, 43, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Wilayah: ${dusunFilter || 'Seluruh Desa'}`, 20, 50);
    doc.text(`Jumlah: ${bnbaList.length} Jiwa`, 190, 50, { align: 'right' });

    const tableData = bnbaList.map((r, idx) => [
      idx + 1,
      r.fullName.toUpperCase(),
      r.nik,
      `${r.dusun}`,
      `RT ${r.rt} / RW ${r.rw}`,
      calculateAge(r.birthDate)
    ]);

    autoTable(doc, {
      head: [['NO', 'NAMA LENGKAP', 'NIK', 'DUSUN', 'RT/RW', 'USIA']],
      body: tableData,
      startY: 55,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        2: { fontStyle: 'normal' },
        5: { halign: 'center', cellWidth: 15 }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.text(`Ngumbul, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 150, finalY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('KEPALA DESA NGUMBUL', 150, finalY + 5, { align: 'center' });
    doc.text(config.villageHeadName.toUpperCase(), 150, finalY + 25, { align: 'center' });

    doc.save(`BNBA_${selectedBNBA.label.replace(/[\s/]/g, '_')}_Ngumbul.pdf`);
  };

  if (!selectedIndicator) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 animate-in fade-in duration-500">
        {INDICATORS_CONFIG.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedIndicator(item.id)}
            className="bg-white p-5 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4 transition-all hover:shadow-xl hover:scale-[1.03] group"
          >
            <div className={`${item.color} text-white p-4 md:p-8 rounded-2xl md:rounded-[2rem] shrink-0 shadow-lg shadow-current/10 group-hover:scale-110 transition-transform`}>
              <item.icon size={24} className="md:w-10 md:h-10" />
            </div>
            <h3 className="text-[10px] md:text-base font-black text-slate-800 uppercase tracking-widest">{item.label}</h3>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button onClick={() => { setSelectedIndicator(null); setDusunFilter(''); }} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-[11px] md:text-xl font-black uppercase tracking-widest text-slate-900">{INDICATORS_CONFIG.find(i => i.id === selectedIndicator)?.label}</h2>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
           <div className="pl-3 pr-1 text-slate-400"><Filter size={14} /></div>
           <select 
             className="bg-transparent text-[10px] md:text-xs font-black uppercase outline-none px-2 py-1 cursor-pointer"
             value={dusunFilter}
             onChange={(e) => setDusunFilter(e.target.value)}
           >
             <option value="">Seluruh Desa</option>
             {dusunList.map(d => <option key={d} value={d}>{d}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-200 shadow-sm relative overflow-hidden">
         <div className="flex items-center justify-between mb-8 md:mb-12">
            <div>
              <h3 className="text-[9px] md:text-sm font-black text-slate-400 uppercase tracking-widest">Visualisasi Data</h3>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Wilayah: {dusunFilter || 'Seluruh Desa'}</p>
            </div>
            <span className="text-[8px] md:text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Klik bar untuk rincian BNBA</span>
         </div>
         <div className="h-[400px] md:h-[600px]">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={currentIndicatorData} layout="vertical" margin={{ left: -10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl text-[10px] font-black uppercase">
                            {payload[0].payload.name}: <span className="text-emerald-400">{payload[0].value} Jiwa</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 10, 10, 0]} 
                    barSize={24} 
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(data) => handleBarClick(data)}
                  >
                    {currentIndicatorData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      {selectedBNBA && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col border border-slate-200 animate-in zoom-in-95">
              <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                       <Users size={24} />
                    </div>
                    <div>
                       <h4 className="text-[11px] md:text-base font-black uppercase tracking-widest leading-none">BNBA: {selectedBNBA.label}</h4>
                       <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{bnbaList.length} Jiwa Ditemukan ({dusunFilter || 'Seluruh Desa'})</p>
                    </div>
                 </div>
                 <div className="flex items-center space-x-2">
                    <button 
                      onClick={handleDownloadBNBAPDF}
                      className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all flex items-center space-x-2 shadow-lg shadow-emerald-900/20"
                      title="Unduh PDF"
                    >
                      <Printer size={18} />
                      <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">Cetak PDF</span>
                    </button>
                    <button onClick={() => setSelectedBNBA(null)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all">
                       <X size={20} />
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
                 <div className="p-4 md:p-6 bg-white border-b border-slate-100 flex items-center">
                    <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                       <Search size={16} className="text-slate-400 mr-3" />
                       <input 
                         type="text" 
                         placeholder="Cari nama dalam daftar ini..." 
                         className="bg-transparent text-xs font-bold outline-none w-full"
                         value={bnbaSearch}
                         onChange={(e) => setBnbaSearch(e.target.value)}
                       />
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {bnbaList.map((r, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:border-blue-500 transition-all group">
                             <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                                {idx + 1}
                             </div>
                             <div className="min-w-0 flex-1">
                                <h5 className="text-[11px] font-black text-slate-900 uppercase truncate leading-none mb-1">{r.fullName}</h5>
                                <div className="flex items-center space-x-3 text-[9px] font-bold text-slate-400">
                                   <span className="font-mono">{r.nik}</span>
                                   <span className="uppercase text-blue-500 font-black">{r.dusun}</span>
                                </div>
                             </div>
                             <div className="hidden sm:block text-[9px] font-black text-slate-300 uppercase">RT {r.rt}</div>
                          </div>
                       ))}
                       {bnbaList.length === 0 && (
                         <div className="col-span-full py-20 text-center">
                            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar nama tidak ditemukan.</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              <div className="p-6 md:p-8 border-t border-slate-100 bg-white flex justify-center shrink-0">
                 <button 
                   onClick={() => setSelectedBNBA(null)}
                   className="px-12 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-2xl transition-all"
                 >
                   Tutup Daftar BNBA
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RecapIndicators;
