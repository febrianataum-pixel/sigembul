
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  HeartPulse, 
  Plus, 
  MapPin, 
  Info, 
  X, 
  Save, 
  User,
  Users,
  FileText, 
  Eye, 
  Calendar, 
  Clock, 
  Download, 
  Printer,
  ChevronRight,
  Filter,
  Baby,
  Stethoscope,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Scale,
  Ruler
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Resident, ResidentStatus, AppConfig, PregnancyRisk, BloodType, MaritalStatus, Education } from '../types';
import { calculatePregnancyAge, formatDate, calculateAge } from '../utils/helpers';
import EditResidentModal from './EditResidentModal';

interface PregnancyManagementProps {
  residents: Resident[];
  setResidents: React.Dispatch<React.SetStateAction<Resident[]>>;
}

const PregnancyManagement: React.FC<PregnancyManagementProps> = ({ residents, setResidents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dusunFilter, setDusunFilter] = useState('');
  const [isSelectingResident, setIsSelectingResident] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [reportingBirthMother, setReportingBirthMother] = useState<Resident | null>(null);

  const dusunList = useMemo(() => 
    Array.from(new Set(residents.filter(r => r.status === 'Aktif').map(r => r.dusun))).sort()
  , [residents]);

  const pregnantResidents = useMemo(() => {
    return residents
      .filter(r => r.status === 'Aktif' && r.isPregnant)
      .filter(r => !dusunFilter || r.dusun === dusunFilter)
      .filter(r => 
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.nik.includes(searchTerm) || 
        r.noKK.includes(searchTerm)
      )
      .sort((a, b) => new Date(a.pregnancyStartDate!).getTime() - new Date(b.pregnancyStartDate!).getTime());
  }, [residents, dusunFilter, searchTerm]);

  const handleBirthSubmission = (baby: Resident) => {
    if (!reportingBirthMother) return;

    setResidents(prev => {
      const next = prev.map(r => {
        if (r.id === reportingBirthMother.id) {
          return {
            ...r, isPregnant: false, pregnancyStartDate: undefined, pregnancyRisk: undefined, pregnancyNotes: undefined
          };
        }
        return r;
      });
      return [...next, baby];
    });

    setReportingBirthMother(null);
    alert(`Data kelahiran berhasil disimpan.`);
  };

  const handleExportPDF = () => {
    if (pregnantResidents.length === 0) return alert("Tidak ada data.");
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.text('DAFTAR MONITORING IBU HAMIL (KIA)', 148.5, 30, { align: 'center' });
    doc.save(`KIA_Ngumbul_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getRiskColor = (risk?: PregnancyRisk) => {
    switch (risk) {
      case 'Tinggi': return { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600', icon: ShieldAlert, label: 'Tinggi (RS)' };
      case 'Sedang': return { bg: 'bg-amber-400', text: 'text-slate-900', border: 'border-amber-500', icon: AlertCircle, label: 'Sedang (PKM)' };
      case 'Rendah': return { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600', icon: ShieldCheck, label: 'Tanpa Resiko' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200', icon: Info, label: 'Belum Klasifikasi' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-pink-500 text-white rounded-2xl flex items-center justify-center">
              <HeartPulse size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter leading-none">Kehamilan</h2>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Monitoring KIA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={() => setIsSelectingResident(true)} className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-3.5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
              <Plus size={14} /> <span>Input</span>
            </button>
            <button onClick={handleExportPDF} className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl">
              <Printer size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 border border-slate-100 w-full">
          <Search size={16} className="text-slate-400 mr-2" />
          <input type="text" placeholder="Cari Bumil..." className="bg-transparent text-xs w-full font-bold dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl px-3 py-2 w-full md:w-auto">
           <MapPin size={14} className="text-slate-400 mr-2" />
           <select className="bg-transparent text-[10px] font-black uppercase outline-none w-full dark:text-white" value={dusunFilter} onChange={(e) => setDusunFilter(e.target.value)}>
             <option value="">Semua Dusun</option>
             {dusunList.map(d => <option key={d} value={d}>{d}</option>)}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pregnantResidents.length > 0 ? pregnantResidents.map((p) => {
          const pregAge = calculatePregnancyAge(p.pregnancyStartDate!);
          const risk = getRiskColor(p.pregnancyRisk);
          return (
            <div key={p.id} className={`bg-white dark:bg-slate-900 rounded-[2rem] border-2 shadow-sm p-6 relative overflow-hidden ${risk.border}`}>
               <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center">
                        <User size={20} />
                     </div>
                     <div>
                        <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white leading-none">{p.fullName}</h4>
                        <p className="text-[9px] text-slate-400 font-mono mt-1">NIK: {p.nik}</p>
                     </div>
                  </div>
                  <button onClick={() => setEditingResident(p)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl"><Eye size={16} /></button>
               </div>

               <div className="space-y-4">
                  <div className={`${risk.bg} ${risk.text} px-3 py-1.5 rounded-xl flex items-center space-x-2 shadow-sm`}>
                       <risk.icon size={12} />
                       <span className="text-[9px] font-black uppercase tracking-widest">{risk.label}</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Usia Hamil</p>
                     <p className="text-base font-black text-pink-600 dark:text-pink-400 leading-none">
                        {pregAge.weeks} <span className="text-[10px] font-bold text-slate-400">Minggu</span>, {pregAge.days} <span className="text-[10px] font-bold text-slate-400">Hari</span>
                     </p>
                  </div>
                  
                  <button onClick={() => setReportingBirthMother(p)} className="w-full py-3 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-600 rounded-xl text-[10px] font-black uppercase flex items-center justify-center space-x-2 hover:bg-emerald-600 hover:text-white transition-all">
                    <Baby size={14} /> <span>Melahirkan</span>
                  </button>
               </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 text-center">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tidak ada data bumil aktif.</p>
          </div>
        )}
      </div>

      {isSelectingResident && <SelectFemaleResidentModal residents={residents} onClose={() => setIsSelectingResident(false)} onSelect={(r) => { setEditingResident(r); setIsSelectingResident(false); }} />}
      {reportingBirthMother && <BirthReportModal mother={reportingBirthMother} residents={residents} onClose={() => setReportingBirthMother(null)} onSave={handleBirthSubmission} />}
      {editingResident && <EditResidentModal resident={editingResident} onClose={() => setEditingResident(null)} onSave={(updated) => { setResidents(prev => prev.map(r => r.id === updated.id ? updated : r)); setEditingResident(null); }} />}
    </div>
  );
};

// Internal Sub-Components
const BirthReportModal: React.FC<{ mother: Resident, residents: Resident[], onClose: () => void, onSave: (baby: Resident) => void }> = ({ mother, residents, onClose, onSave }) => {
  const father = residents.find(r => r.noKK === mother.noKK && (r.isHeadOfFamily || r.relationship.includes('Kepala')));
  const [formData, setFormData] = useState({ nik: '', fullName: '', gender: '1. Laki-laki' as any, birthDate: new Date().toISOString().split('T')[0], bloodType: 'Tidak tahu' as BloodType, birthLength: '', birthWeight: '', birthNotes: '' });
  const inputClass = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white outline-none";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        <div className="p-6 bg-emerald-600 text-white flex justify-between items-center"><div className="flex items-center space-x-3"><Baby size={20} /><span className="text-sm font-black uppercase">Lapor Kelahiran</span></div><button onClick={onClose}><X size={20}/></button></div>
        <form onSubmit={(e) => { e.preventDefault(); if (formData.nik.length !== 16) return alert("NIK 16 Digit!"); onSave({ id: `birth-${Date.now()}`, dusun: mother.dusun, rt: mother.rt, rw: mother.rw, noKK: mother.noKK, nik: formData.nik, fullName: formData.fullName.toUpperCase(), relationship: '3. Anak Kandung/Tiri', birthPlace: 'BLORA', birthDate: formData.birthDate, gender: formData.gender, bloodType: formData.bloodType, maritalStatus: '1. Belum kawin' as any, education: '1. Tidak/belum pernah sekolah' as any, job: '22. Pelajar/Mahasiswa', fatherName: father?.fullName || '-', motherName: mother.fullName, isHeadOfFamily: false, status: 'Aktif', birthLength: formData.birthLength, birthWeight: formData.birthWeight, birthNotes: formData.birthNotes } as Resident); }} className="p-6 space-y-4 overflow-y-auto">
           <div className="grid grid-cols-1 gap-4">
              <div><label className="text-[9px] font-black text-slate-400 block mb-1 uppercase">Nama Bayi</label><input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className={`${inputClass} font-black uppercase`} required /></div>
              <div><label className="text-[9px] font-black text-slate-400 block mb-1 uppercase">NIK Bayi</label><input type="text" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value.replace(/\D/g, '').slice(0, 16)})} className={inputClass} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[9px] font-black text-slate-400 block mb-1 uppercase">JK</label><select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className={inputClass}><option value="1. Laki-laki">Laki-laki</option><option value="2. Perempuan">Perempuan</option></select></div>
                <div><label className="text-[9px] font-black text-slate-400 block mb-1 uppercase">Tgl Lahir</label><input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className={inputClass} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[9px] font-black text-slate-400 block mb-1 uppercase">Panjang (cm)</label><input type="text" value={formData.birthLength} onChange={e => setFormData({...formData, birthLength: e.target.value})} className={inputClass} /></div>
                <div><label className="text-[9px] font-black text-slate-400 block mb-1 uppercase">Berat (gr)</label><input type="text" value={formData.birthWeight} onChange={e => setFormData({...formData, birthWeight: e.target.value})} className={inputClass} /></div>
              </div>
           </div>
           <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl">Simpan & Selesaikan KIA</button>
        </form>
      </div>
    </div>
  );
};

const SelectFemaleResidentModal: React.FC<{ residents: Resident[], onClose: () => void, onSelect: (r: Resident) => void }> = ({ residents, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => residents.filter(r => r.status === 'Aktif' && r.gender.includes('Perempuan') && !r.isPregnant).filter(r => r.fullName.toLowerCase().includes(query.toLowerCase()) || r.nik.includes(query)).slice(0, 5), [residents, query]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="p-6 bg-pink-600 text-white flex justify-between items-center"><span className="text-sm font-black uppercase">Pilih Ibu</span><button onClick={onClose}><X size={20}/></button></div>
        <div className="p-6 space-y-4">
          <input type="text" placeholder="Cari..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold dark:text-white outline-none" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="space-y-2">
             {filtered.map(r => (
               <button key={r.id} onClick={() => onSelect(r)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-xl hover:bg-pink-50 transition-all"><h4 className="text-[10px] font-black uppercase text-slate-900 dark:text-white">{r.fullName}</h4><p className="text-[8px] text-slate-400">NIK: {r.nik}</p></button>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PregnancyManagement;
