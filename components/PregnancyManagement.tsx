
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
        // 1. Update data Ibu (Hapus status hamil)
        if (r.id === reportingBirthMother.id) {
          return {
            ...r,
            isPregnant: false,
            pregnancyStartDate: undefined,
            pregnancyRisk: undefined,
            pregnancyNotes: undefined
          };
        }
        return r;
      });
      // 2. Tambah data Bayi
      return [...next, baby];
    });

    setReportingBirthMother(null);
    alert(`Data kelahiran ${baby.fullName} berhasil disimpan dan status kehamilan ibu telah diperbarui.`);
  };

  const handleExportPDF = () => {
    if (pregnantResidents.length === 0) return alert("Tidak ada data untuk diekspor.");
    
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PEMERINTAH KABUPATEN BLORA', 148.5, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('KECAMATAN TODANAN - DESA NGUMBUL', 148.5, 21, { align: 'center' });
    doc.setFontSize(11);
    doc.text('DAFTAR MONITORING IBU HAMIL (KIA)', 148.5, 30, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(20, 32, 277, 32);

    const tableData = pregnantResidents.map((p, idx) => {
      const age = calculatePregnancyAge(p.pregnancyStartDate!);
      return [
        idx + 1,
        p.fullName.toUpperCase(),
        p.nik,
        p.noKK,
        formatDate(p.pregnancyStartDate!),
        `${age.weeks} Minggu, ${age.days} Hari`,
        p.pregnancyRisk?.toUpperCase() || '-',
        p.pregnancyNotes || '-',
        p.dusun.toUpperCase()
      ];
    });

    autoTable(doc, {
      head: [['NO', 'NAMA IBU', 'NIK', 'NOMOR KK', 'TGL HPHT', 'USIA HAMIL', 'RESIKO', 'KETERANGAN', 'DUSUN']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [219, 39, 119], halign: 'center' },
    });

    doc.save(`Data_IbuHamil_Ngumbul_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getRiskColor = (risk?: PregnancyRisk) => {
    switch (risk) {
      case 'Tinggi': return { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600', icon: ShieldAlert, label: 'Resiko Tinggi (RS)' };
      case 'Sedang': return { bg: 'bg-amber-400', text: 'text-slate-900', border: 'border-amber-500', icon: AlertCircle, label: 'Resiko Sedang (PKM)' };
      case 'Rendah': return { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600', icon: ShieldCheck, label: 'Tanpa Resiko (PKM)' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200', icon: Info, label: 'Belum Klasifikasi' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Main Actions */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className="w-14 h-14 bg-pink-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
              <HeartPulse size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Manajemen Kehamilan</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Monitoring Ibu Hamil & Kesehatan Ibu Anak (KIA)</p>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-3">
             <button 
              onClick={() => setIsSelectingResident(true)}
              className="flex items-center space-x-3 px-8 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-pink-600 dark:hover:bg-blue-500 transition-all shadow-xl shadow-slate-200"
            >
              <Plus size={18} />
              <span>Input Data Bumil</span>
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center space-x-2 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <Download size={18} />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-3 border border-slate-100 dark:border-slate-700 w-full focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-4 focus-within:ring-pink-500/10 transition-all">
          <Search size={18} className="text-slate-400 mr-3" />
          <input 
            type="text" 
            placeholder="Cari Nama Ibu / NIK / No. KK..."
            className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 min-w-[200px] w-full md:w-auto">
           <MapPin size={16} className="text-slate-400 mr-2" />
           <select 
             className="bg-transparent text-xs font-black uppercase outline-none w-full text-slate-900 dark:text-white"
             value={dusunFilter}
             onChange={(e) => setDusunFilter(e.target.value)}
           >
             <option value="" className="dark:bg-slate-800">Semua Dusun</option>
             {dusunList.map(d => <option key={d} value={d} className="dark:bg-slate-800">{d}</option>)}
           </select>
        </div>
      </div>

      {/* Pregnant Residents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pregnantResidents.length > 0 ? pregnantResidents.map((p) => {
          const pregAge = calculatePregnancyAge(p.pregnancyStartDate!);
          const risk = getRiskColor(p.pregnancyRisk);
          return (
            <div key={p.id} className={`bg-white dark:bg-slate-900 rounded-[2rem] border-2 shadow-sm hover:shadow-xl transition-all group p-6 overflow-hidden relative ${risk.border}`}>
               <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-10 group-hover:scale-110 transition-transform ${risk.bg}`}></div>
               
               <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                     <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl flex items-center justify-center">
                        <User size={24} />
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none truncate max-w-[150px]">{p.fullName}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">NIK: {p.nik}</p>
                     </div>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-900 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer" onClick={() => setEditingResident(p)}>
                     <Eye size={16} />
                  </div>
               </div>

               <div className="space-y-4 relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className={`${risk.bg} ${risk.text} px-3 py-1.5 rounded-xl flex items-center space-x-2 w-full shadow-sm`}>
                       <risk.icon size={14} />
                       <span className="text-[10px] font-black uppercase tracking-widest">{risk.label}</span>
                    </div>
                  </div>

                  {p.pregnancyNotes && (
                    <div className="flex items-start space-x-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                       <MessageSquare size={12} className="text-slate-400 mt-0.5 shrink-0" />
                       <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">{p.pregnancyNotes}</p>
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Usia Kehamilan</p>
                     <p className="text-lg font-black text-pink-600 dark:text-pink-400 leading-none">
                        {pregAge.weeks} <span className="text-xs font-bold text-slate-400">Minggu</span>, {pregAge.days} <span className="text-xs font-bold text-slate-400">Hari</span>
                     </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Mulai Hamil</p>
                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-300">{formatDate(p.pregnancyStartDate!)}</p>
                     </div>
                     <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Dusun</p>
                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">{p.dusun}</p>
                     </div>
                  </div>
                  
                  <button 
                    onClick={() => setReportingBirthMother(p)}
                    className="w-full py-3 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <Baby size={14} />
                    <span>Sudah Melahirkan</span>
                  </button>
               </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-32 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 text-center">
             <HeartPulse size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tidak ada data ibu hamil aktif ditemukan.</p>
          </div>
        )}
      </div>

      {/* Select Resident Modal */}
      {isSelectingResident && (
        <SelectFemaleResidentModal 
          residents={residents} 
          onClose={() => setIsSelectingResident(false)}
          onSelect={(r) => {
            setEditingResident(r);
            setIsSelectingResident(false);
          }}
        />
      )}

      {/* Report Birth Modal */}
      {reportingBirthMother && (
        <BirthReportModal 
          mother={reportingBirthMother} 
          residents={residents}
          onClose={() => setReportingBirthMother(null)}
          onSave={handleBirthSubmission}
        />
      )}

      {/* Edit Modal */}
      {editingResident && (
        <EditResidentModal 
          resident={editingResident} 
          onClose={() => setEditingResident(null)} 
          onSave={(updated) => {
            setResidents(prev => prev.map(r => r.id === updated.id ? updated : r));
            setEditingResident(null);
          }}
        />
      )}
    </div>
  );
};

// --- Sub-Components ---

const BirthReportModal: React.FC<{ mother: Resident, residents: Resident[], onClose: () => void, onSave: (baby: Resident) => void }> = ({ mother, residents, onClose, onSave }) => {
  const father = residents.find(r => r.noKK === mother.noKK && (r.isHeadOfFamily || r.relationship.includes('Kepala')));
  
  const [formData, setFormData] = useState({
    nik: '',
    fullName: '',
    gender: '1. Laki-laki' as any,
    birthDate: new Date().toISOString().split('T')[0],
    bloodType: 'Tidak tahu' as BloodType,
    birthLength: '',
    birthWeight: '',
    birthNotes: ''
  });

  const inputClass = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition-all outline-none";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nik.length !== 16) return alert("NIK harus tepat 16 digit!");
    
    const baby: Resident = {
      id: `birth-${Date.now()}`,
      dusun: mother.dusun,
      rt: mother.rt,
      rw: mother.rw,
      noKK: mother.noKK,
      nik: formData.nik,
      fullName: formData.fullName.toUpperCase(),
      relationship: '3. Anak Kandung/Tiri',
      birthPlace: 'BLORA',
      birthDate: formData.birthDate,
      gender: formData.gender,
      bloodType: formData.bloodType,
      maritalStatus: '1. Belum kawin' as any,
      education: '1. Tidak/belum pernah sekolah' as any,
      job: '22. Pelajar/Mahasiswa',
      fatherName: father?.fullName || '-',
      motherName: mother.fullName,
      isHeadOfFamily: false,
      status: 'Aktif',
      birthLength: formData.birthLength,
      birthWeight: formData.birthWeight,
      birthNotes: formData.birthNotes
    };
    onSave(baby);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Baby size={24} />
            <span className="text-sm font-black uppercase tracking-widest">Lapor Kelahiran Bayi</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-700 rounded-xl transition-all"><X size={24}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
           <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between mb-2">
              <div>
                 <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Nama Ibu</p>
                 <p className="text-xs font-black uppercase text-slate-800 dark:text-white">{mother.fullName}</p>
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Nama Ayah</p>
                 <p className="text-xs font-black uppercase text-slate-800 dark:text-white">{father?.fullName || '-'}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase">Nama Lengkap Bayi</label>
                <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className={`${inputClass} font-black uppercase`} required placeholder="NAMA BAYI" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase">NIK Bayi (16 Digit)</label>
                <input type="text" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value.replace(/\D/g, '').slice(0, 16)})} className={inputClass} required placeholder="16 Digit NIK" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase">Jenis Kelamin</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className={inputClass}>
                  <option value="1. Laki-laki">Laki-laki</option>
                  <option value="2. Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase">Tanggal Lahir</label>
                <input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className={inputClass} required />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase">Golongan Darah</label>
                <select value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value as BloodType})} className={inputClass}>
                  <option value="Tidak tahu">Tidak tahu</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase flex items-center">
                  <Ruler size={10} className="mr-1.5" /> Panjang Bayi (cm)
                </label>
                <input type="text" value={formData.birthLength} onChange={e => setFormData({...formData, birthLength: e.target.value})} className={inputClass} placeholder="Contoh: 50" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase flex items-center">
                  <Scale size={10} className="mr-1.5" /> Berat Bayi (gram/kg)
                </label>
                <input type="text" value={formData.birthWeight} onChange={e => setFormData({...formData, birthWeight: e.target.value})} className={inputClass} placeholder="Contoh: 3200" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase flex items-center">
                  <MessageSquare size={10} className="mr-1.5" /> Keterangan Tambahan
                </label>
                <textarea value={formData.birthNotes} onChange={e => setFormData({...formData, birthNotes: e.target.value})} className={`${inputClass} h-20 resize-none py-2 text-[11px] font-normal`} placeholder="Misal: Kondisi sehat, lahir di RS Blora, dll..." />
              </div>
           </div>

           <div className="pt-4 flex space-x-3">
              <button type="button" onClick={onClose} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Batal</button>
              <button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center space-x-3">
                <Save size={18} />
                <span>Simpan & Selesaikan KIA</span>
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

const SelectFemaleResidentModal: React.FC<{ residents: Resident[], onClose: () => void, onSelect: (r: Resident) => void }> = ({ residents, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    return residents
      .filter(r => r.status === 'Aktif' && r.gender.includes('Perempuan') && !r.isPregnant)
      .filter(r => r.fullName.toLowerCase().includes(query.toLowerCase()) || r.nik.includes(query))
      .slice(0, 5);
  }, [residents, query]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
        <div className="p-6 bg-pink-600 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <HeartPulse size={20} />
            <span className="text-sm font-black uppercase tracking-widest">Pilih Ibu (Data KIA)</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-pink-700 rounded-xl transition-all"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-5 py-3.5 border border-slate-200 dark:border-slate-700 flex items-center focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
            <Search size={18} className="text-slate-400 mr-3" />
            <input autoFocus type="text" placeholder="Cari Nama / NIK..." className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-900 dark:text-white" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="space-y-3">
             {filtered.length > 0 ? filtered.map(r => (
               <button key={r.id} onClick={() => onSelect(r)} className="w-full text-left p-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all group">
                 <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">{r.fullName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">NIK: {r.nik}</p>
                    </div>
                    <div className="text-[9px] font-black text-slate-400 uppercase bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">{r.dusun}</div>
                 </div>
               </button>
             )) : <div className="py-10 text-center"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cari penduduk wanita aktif...</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PregnancyManagement;
