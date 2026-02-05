
import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye,
  CheckSquare,
  Square,
  Upload,
  BookOpen,
  Loader2,
  MapPin,
  X,
  Edit3,
  Download,
  RefreshCcw,
  Printer,
  Info,
  PlaneLanding,
  Calendar,
  Save,
  MoreVertical,
  ChevronRight,
  User,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Resident, BloodType, MaritalStatus, Education, ResidentStatus, AppConfig } from '../types';
import { calculateAge, downloadTemplate, downloadCSV } from '../utils/helpers';
import FamilyDetailModal from './FamilyDetailModal';
import EditResidentModal from './EditResidentModal';
import AddResidentModal from './AddResidentModal';

interface PopulationManagementProps {
  residents: Resident[];
  setResidents: React.Dispatch<React.SetStateAction<Resident[]>>;
  config: AppConfig;
}

const PopulationManagement: React.FC<PopulationManagementProps> = ({ residents, setResidents, config }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isPreparingPDF, setIsPreparingPDF] = useState(false);
  const [filters, setFilters] = useState({ dusun: '', rw: '', rt: '' });
  const [viewingFamilyKK, setViewingFamilyKK] = useState<string | null>(null);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingFamily, setDeletingFamily] = useState<{item: Resident, ids?: string[]} | null>(null);
  const [movingFamily, setMovingFamily] = useState<Resident | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeResidents = useMemo(() => residents.filter(r => r.status === 'Aktif'), [residents]);
  const headOfFamilies = useMemo(() => activeResidents.filter(r => r.isHeadOfFamily), [activeResidents]);
  
  const dusunList = useMemo(() => Array.from(new Set(activeResidents.map(r => r.dusun))).sort(), [activeResidents]);
  
  const rwList = useMemo(() => {
    const filtered = filters.dusun ? activeResidents.filter(r => r.dusun === filters.dusun) : activeResidents;
    return Array.from(new Set(filtered.map(r => r.rw))).sort();
  }, [activeResidents, filters.dusun]);

  const rtList = useMemo(() => {
    let filtered = filters.dusun ? activeResidents.filter(r => r.dusun === filters.dusun) : activeResidents;
    if (filters.rw) filtered = filtered.filter(r => r.rw === filters.rw);
    return Array.from(new Set(filtered.map(r => r.rt))).sort();
  }, [activeResidents, filters.dusun, filters.rw]);

  const filteredData = useMemo(() => {
    return headOfFamilies.filter(r => {
      const s = searchTerm.toLowerCase();
      const matchSearch = r.fullName.toLowerCase().includes(s) || r.nik.includes(s) || r.noKK.includes(s);
      const matchDusun = !filters.dusun || r.dusun === filters.dusun;
      const matchRW = !filters.rw || r.rw === filters.rw;
      const matchRT = !filters.rt || r.rt === filters.rt;
      return matchSearch && matchDusun && matchRW && matchRT;
    });
  }, [headOfFamilies, searchTerm, filters]);

  const residentsToExport = useMemo(() => {
    const displayedKKs = new Set(filteredData.map(r => r.noKK.trim()));
    return activeResidents
      .filter(r => displayedKKs.has(r.noKK.trim()))
      .sort((a, b) => {
        if (a.dusun !== b.dusun) return a.dusun.localeCompare(b.dusun);
        if (a.rw !== b.rw) return a.rw.localeCompare(b.rw);
        if (a.rt !== b.rt) return a.rt.localeCompare(b.rt);
        if (a.noKK !== b.noKK) return a.noKK.localeCompare(b.noKK);
        return a.relationship.localeCompare(b.relationship);
      });
  }, [filteredData, activeResidents]);

  const handleDownloadPDF = async () => {
    if (residentsToExport.length === 0) return alert("Tidak ada data untuk dicetak.");
    setIsPreparingPDF(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const addHeader = (data: any) => {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PEMERINTAH KABUPATEN BLORA', 148.5, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text('KECAMATAN TODANAN - DESA NGUMBUL', 148.5, 21, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.line(20, 28, 277, 28);
        doc.setFontSize(11);
        doc.text('DAFTAR PENDUDUK BY NAME BY ADDRESS (BNBA)', 148.5, 38, { align: 'center' });
      };

      const tableData = residentsToExport.map((r, idx) => [
        idx + 1, r.fullName.toUpperCase(), r.nik, r.noKK, `${r.dusun} / ${r.rw} / ${r.rt}`,
        r.gender.includes('Laki') ? 'L' : 'P', calculateAge(r.birthDate), r.relationship.split('. ').pop() || r.relationship,
        r.education.split('. ').pop() || r.education, r.job.split('. ').pop()?.toUpperCase() || r.job.toUpperCase()
      ]);

      autoTable(doc, {
        head: [['NO', 'NAMA LENGKAP', 'NIK', 'NOMOR KK', 'ALAMAT', 'JK', 'USIA', 'HUBUNGAN', 'PENDIDIKAN', 'PEKERJAAN']],
        body: tableData,
        startY: 50,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },
        didDrawPage: (data) => { if (data.pageNumber === 1) addHeader(data); }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.text(`Ngumbul, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 230, finalY + 15, { align: 'center' });
      doc.text('KEPALA DESA NGUMBUL', 230, finalY + 20, { align: 'center' });
      doc.text(config.villageHeadName.toUpperCase(), 230, finalY + 40, { align: 'center' });
      doc.save(`BNBA_Ngumbul_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      alert("Gagal membuat PDF.");
    } finally {
      setIsPreparingPDF(false);
    }
  };

  const handleDownloadCSV = () => {
    if (residentsToExport.length === 0) return alert("Tidak ada data untuk diekspor.");
    const dataToExport = residentsToExport.map(r => ({
      'Dusun': r.dusun, 'RW': r.rw, 'RT': r.rt, 'No. KK': r.noKK, 'NIK': r.nik, 
      'Nama Lengkap': r.fullName, 'Hubungan': r.relationship, 'Tgl Lahir': r.birthDate,
      'Usia': calculateAge(r.birthDate), 'JK': r.gender, 'Gol. Darah': r.bloodType,
      'Status': r.maritalStatus, 'Pendidikan': r.education, 'Pekerjaan': r.job
    }));
    downloadCSV(dataToExport, `BNBA_Ngumbul_${new Date().toISOString().split('T')[0]}`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const delimiter = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
        const newResidents: Resident[] = lines.slice(1).map((line, index) => {
          const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
          const item: any = {};
          headers.forEach((h, i) => item[h] = values[i] || '');
          const rel = item['Status Hubungan dalam Keluarga'] || item['Hubungan'] || '';
          return {
            id: `imp-${Date.now()}-${index}`,
            dusun: item['Dusun'] || '-',
            rt: item['RT'] || '-',
            rw: item['RW'] || '-',
            noKK: (item['No.KK'] || item['No. KK'] || '').replace(/\D/g, '').slice(0, 16),
            nik: (item['NIK'] || '').replace(/\D/g, '').slice(0, 16),
            fullName: (item['Nama Lengkap'] || '-').toUpperCase(),
            relationship: rel,
            birthPlace: item['Tempat Lahir'] || '', 
            birthDate: item['Tanggal Lahir'] || item['Tgl Lahir'] || '1990-01-01',
            gender: (item['Jenis Kelamin'] || item['JK'] || '').includes('P') ? 'Perempuan' : 'Laki-laki',
            bloodType: (item['Golongan Darah'] || item['Gol. Darah'] || 'Tidak Tahu') as BloodType,
            maritalStatus: (item['Status Perkawinan'] || item['Status'] || 'Belum Kawin') as MaritalStatus,
            education: (item['Pendidikan Tertinggi'] || item['Pendidikan'] || 'SMA') as Education,
            job: item['Pekerjaan'] || '',
            fatherName: item['Nama Ayah Kandung'] || '',
            motherName: item['Nama Ibu Kandung'] || '',
            isHeadOfFamily: rel.toLowerCase().includes('kepala keluarga') || rel.startsWith('1'),
            status: 'Aktif' as ResidentStatus
          };
        });
        setResidents(prev => [...prev, ...newResidents]);
        setIsImporting(false);
        alert(`Berhasil mengimpor ${newResidents.length} data.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        alert('Gagal impor.');
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleArchiveMove = (destination: string, date: string) => {
    if (!movingFamily) return;
    setResidents(prev => prev.map(r => 
      r.noKK === movingFamily.noKK ? {
        ...r, status: 'Pindah' as ResidentStatus, moveDestination: destination, moveDate: date
      } : r
    ));
    setMovingFamily(null);
  };

  return (
    <div className="space-y-3 md:space-y-6">
      {(isImporting || isPreparingPDF) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl text-center">
             <Loader2 className="mx-auto text-blue-600 animate-spin mb-4" size={32} />
             <p className="text-xs font-black uppercase text-slate-950 dark:text-white">{isPreparingPDF ? "Cetak PDF..." : "Memproses..."}</p>
          </div>
        </div>
      )}

      {/* Main Action Bar - Optimized for Mobile (Smaller Buttons) */}
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 no-print">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 w-full focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
          <Search size={16} className="text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Cari Nama/NIK/KK..."
            className="bg-transparent border-none outline-none text-xs w-full font-bold text-slate-950 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center overflow-x-auto gap-1.5 pb-0.5 scrollbar-hide">
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-1.5 px-3 py-2 bg-slate-950 dark:bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase whitespace-nowrap shadow-sm">
            <Plus size={12} /> <span>Tambah KK</span>
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 text-white rounded-lg text-[8px] font-black uppercase whitespace-nowrap">
            <Printer size={12} /> <span>Cetak</span>
          </button>
          <button onClick={handleDownloadCSV} className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-[8px] font-black uppercase whitespace-nowrap">
            <Download size={12} /> <span>CSV</span>
          </button>
          <label className="flex items-center space-x-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-[8px] font-black uppercase whitespace-nowrap cursor-pointer">
            <Upload size={12} /> <span>Import</span>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleImport} accept=".csv" />
          </label>
        </div>
      </div>

      {/* Advanced Filter Bar (Compact Mobile) */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-hide">
        <div className="flex items-center space-x-2 min-w-max">
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5">
            <MapPin size={10} className="text-slate-400 mr-1.5" />
            <select className="bg-transparent text-[8px] font-black uppercase outline-none text-slate-950 dark:text-white" value={filters.dusun} onChange={(e) => setFilters({ ...filters, dusun: e.target.value, rw: '', rt: '' })}>
              <option value="">Dusun</option>
              {dusunList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5">
            <span className="text-[7px] font-black text-slate-400 mr-1.5 uppercase">RW</span>
            <select className="bg-transparent text-[8px] font-black outline-none text-slate-950 dark:text-white" value={filters.rw} onChange={(e) => setFilters({ ...filters, rw: e.target.value, rt: '' })} disabled={!filters.dusun}>
              <option value="">-</option>
              {rwList.map(rw => <option key={rw} value={rw}>{rw}</option>)}
            </select>
          </div>
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5">
            <span className="text-[7px] font-black text-slate-400 mr-1.5 uppercase">RT</span>
            <select className="bg-transparent text-[8px] font-black outline-none text-slate-950 dark:text-white" value={filters.rt} onChange={(e) => setFilters({ ...filters, rt: e.target.value })} disabled={!filters.rw}>
              <option value="">-</option>
              {rtList.map(rt => <option key={rt} value={rt}>{rt}</option>)}
            </select>
          </div>
          <button onClick={() => setFilters({ dusun: '', rw: '', rt: '' })} className="p-1.5 text-slate-400 hover:text-slate-900 transition-all"><RefreshCcw size={12} /></button>
          <div className="text-[8px] font-black text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-lg ml-auto">
            {filteredData.length} KK
          </div>
        </div>
      </div>

      {/* Ultra-Compact Card View (Mobile Only) */}
      <div className="grid grid-cols-1 md:hidden gap-3 no-print">
        {filteredData.length > 0 ? filteredData.map((r) => (
          <div key={r.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
             {/* Left Marker */}
             <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
             
             <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                   <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                      <User size={16} />
                   </div>
                   <div className="min-w-0 flex-1">
                      <button 
                        onClick={() => setViewingFamilyKK(r.noKK)}
                        className="text-[11px] font-black uppercase text-slate-950 dark:text-white leading-tight truncate text-left w-full hover:text-blue-600 transition-colors"
                      >
                        {r.fullName}
                      </button>
                      <button 
                        onClick={() => setViewingFamilyKK(r.noKK)}
                        className="text-[9px] font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5 truncate block"
                      >
                        KK: {r.noKK}
                      </button>
                   </div>
                </div>
                <div className="flex items-center space-x-1 shrink-0 ml-2">
                   <button onClick={() => setViewingFamilyKK(r.noKK)} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Eye size={14} /></button>
                   <button onClick={() => setEditingResident(r)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg"><Edit3 size={14} /></button>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-2.5 mb-3">
                <div className="min-w-0">
                   <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Wilayah</p>
                   <p className="text-[9px] font-bold text-slate-800 dark:text-slate-300 uppercase truncate leading-none">{r.dusun}</p>
                   <p className="text-[8px] font-black text-slate-500 uppercase mt-0.5">RT {r.rt} / RW {r.rw}</p>
                </div>
                <div className="min-w-0">
                   <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">NIK Penduduk</p>
                   <p className="text-[9px] font-mono font-bold text-slate-800 dark:text-slate-300 truncate leading-none">{r.nik}</p>
                   <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md inline-block mt-1 ${r.gender.includes('Laki') ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                      {r.gender.includes('Laki') ? 'LAKI-LAKI' : 'PEREMPUAN'}
                   </span>
                </div>
             </div>

             <div className="flex items-center gap-2">
                <button onClick={() => setMovingFamily(r)} className="flex-1 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-[8px] font-black uppercase border border-amber-100 dark:border-amber-800 flex items-center justify-center space-x-1.5">
                   <PlaneLanding size={10} /> <span>Pindah</span>
                </button>
                <button onClick={() => setDeletingFamily({ item: r })} className="flex-1 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[8px] font-black uppercase border border-rose-100 dark:border-rose-800 flex items-center justify-center space-x-1.5">
                   <Trash2 size={10} /> <span>Hapus</span>
                </button>
             </div>
          </div>
        )) : (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tidak ada data</p>
          </div>
        )}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-4 w-10 text-center"><Square size={18} className="text-slate-300" /></th>
                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-widest text-center w-40">Aksi</th>
                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-widest">Alamat</th>
                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-widest">Identitas</th>
                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-widest">Kepala Keluarga</th>
                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-widest text-center">Profil</th>
                <th className="px-3 py-4 text-[9px] font-black uppercase tracking-widest">Kerja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.map((r) => (
                <tr key={r.id} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all text-slate-950 dark:text-slate-100">
                  <td className="px-4 py-5 text-center"><Square size={18} className="text-slate-200 dark:text-slate-700" /></td>
                  <td className="px-3 py-5">
                    <div className="flex items-center justify-center space-x-1">
                      <button onClick={() => setViewingFamilyKK(r.noKK)} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Eye size={14} /></button>
                      <button onClick={() => setEditingResident(r)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-600 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 hover:text-white transition-all"><Edit3 size={14} /></button>
                      <button onClick={() => setMovingFamily(r)} className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all"><PlaneLanding size={14} /></button>
                      <button onClick={() => setDeletingFamily({ item: r })} className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={14} /></button>
                    </div>
                  </td>
                  <td className="px-3 py-5">
                    <div className="text-[11px] font-black">{r.dusun}</div>
                    <div className="text-[9px] text-slate-500 font-bold">RT {r.rt} / RW {r.rw}</div>
                  </td>
                  <td className="px-3 py-5">
                    <button 
                      onClick={() => setViewingFamilyKK(r.noKK)}
                      className="text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline block text-left"
                    >
                      {r.noKK}
                    </button>
                    <div className="text-[9px] text-slate-500 dark:text-slate-500 font-mono font-bold">{r.nik}</div>
                  </td>
                  <td className="px-3 py-5">
                    <button 
                      onClick={() => setViewingFamilyKK(r.noKK)}
                      className="text-[11px] font-black uppercase text-left hover:text-blue-600 transition-colors"
                    >
                      {r.fullName}
                    </button>
                  </td>
                  <td className="px-3 py-5 text-center">
                    <div className="text-[11px] font-black">{calculateAge(r.birthDate)} <span className="text-[8px] text-slate-400 font-bold">THN</span></div>
                  </td>
                  <td className="px-3 py-5 text-[10px] text-slate-600 dark:text-slate-400 font-bold truncate max-w-[120px]">
                    {r.job || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals Section */}
      {viewingFamilyKK && <FamilyDetailModal noKK={viewingFamilyKK} residents={residents} setResidents={setResidents} onClose={() => setViewingFamilyKK(null)} />}
      {editingResident && <EditResidentModal resident={editingResident} onClose={() => setEditingResident(null)} onSave={(u) => { setResidents(prev => prev.map(r => r.id === u.id ? u : r)); setEditingResident(null); }} />}
      {isAddModalOpen && <AddResidentModal onClose={() => setIsAddModalOpen(false)} onSave={(nr) => { setResidents(prev => [...prev, ...nr]); setIsAddModalOpen(false); }} />}
      {movingFamily && <MoveFamilyModal item={movingFamily} onClose={() => setMovingFamily(null)} onConfirm={handleArchiveMove} />}

      {deletingFamily && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="p-5 bg-slate-950 text-white flex justify-between items-center uppercase font-black text-[10px]">
               <span>Konfirmasi Hapus</span>
               <button onClick={() => setDeletingFamily(null)}><X size={20}/></button>
            </div>
            <div className="p-8 space-y-4">
               <div className="text-center bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900/40">
                 <h5 className="text-sm font-black uppercase text-slate-950 dark:text-white leading-tight">{deletingFamily.item.fullName}</h5>
               </div>
               <button onClick={() => {
                  setResidents(prev => prev.map(r => r.noKK === deletingFamily.item.noKK ? {...r, status: 'Terhapus' as ResidentStatus, deleteDate: new Date().toISOString().split('T')[0], deleteReason: 'Mobile'} : r));
                  setDeletingFamily(null);
               }} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-rose-700">Konfirmasi Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MoveFamilyModal: React.FC<{ item: Resident, onClose: () => void, onConfirm: (dest: string, date: string) => void }> = ({ item, onClose, onConfirm }) => {
  const [dest, setDest] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
        <div className="p-5 bg-amber-500 text-white flex justify-between items-center uppercase font-black text-[10px]">
           <span>Lapor Pindah</span>
           <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-8 space-y-5">
           <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tujuan Pindah</label>
                <input type="text" value={dest} onChange={e => setDest(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-xs uppercase text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20" placeholder="Contoh: Jakarta" required />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tanggal</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-xs text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20" required />
              </div>
           </div>
           <button onClick={() => dest.trim() ? onConfirm(dest, date) : alert("Isi tujuan!")} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-amber-600 transition-all">Konfirmasi Pindah</button>
        </div>
      </div>
    </div>
  );
};

export default PopulationManagement;
