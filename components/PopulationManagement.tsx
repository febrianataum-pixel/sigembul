
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
  Save
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const addHeader = (data: any) => {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PEMERINTAH KABUPATEN BLORA', 148.5, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text('KECAMATAN TODANAN - DESA NGUMBUL', 148.5, 21, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Alamat: Jl. Raya Todanan-Ngumbul KM. 05, Desa Ngumbul, Kec. Todanan, Kab. Blora (58256)', 148.5, 26, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.line(20, 28, 277, 28);
        doc.setLineWidth(0.1);
        doc.line(20, 29, 277, 29);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('DAFTAR PENDUDUK BY NAME BY ADDRESS (BNBA)', 148.5, 38, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Wilayah: ${filters.dusun || 'Seluruh Desa'} ${filters.rw ? '/ RW ' + filters.rw : ''} ${filters.rt ? '/ RT ' + filters.rt : ''}`, 20, 45);
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 277, 45, { align: 'right' });
      };

      const tableData = residentsToExport.map((r, idx) => [
        idx + 1,
        r.fullName.toUpperCase(),
        r.nik,
        r.noKK,
        `${r.dusun} / ${r.rw} / ${r.rt}`,
        r.gender.includes('Laki') ? 'L' : 'P',
        calculateAge(r.birthDate),
        r.relationship.split('. ').pop() || r.relationship,
        r.education.split('. ').pop() || r.education,
        r.job.split('. ').pop()?.toUpperCase() || r.job.toUpperCase()
      ]);

      autoTable(doc, {
        head: [['NO', 'NAMA LENGKAP', 'NIK', 'NOMOR KK', 'ALAMAT (DS/RW/RT)', 'JK', 'USIA', 'HUBUNGAN', 'PENDIDIKAN', 'PEKERJAAN']],
        body: tableData,
        startY: 50,
        styles: { fontSize: 7, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.1 },
        headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { fontStyle: 'bold', cellWidth: 45 },
          5: { halign: 'center', cellWidth: 8 },
          6: { halign: 'center', cellWidth: 10 },
        },
        margin: { top: 50, bottom: 40 },
        didDrawPage: (data) => {
          if (data.pageNumber === 1) {
            addHeader(data);
          }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 150;
      const signatureY = finalY + 15;
      
      let currentY: number;
      if (signatureY > 170) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY = signatureY;
      }

      const dateStr = `Ngumbul, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      doc.setFontSize(9);
      doc.text(dateStr, 230, currentY, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text('KEPALA DESA NGUMBUL', 230, currentY + 5, { align: 'center' });
      doc.text(config.villageHeadName.toUpperCase(), 230, currentY + 25, { align: 'center' });
      doc.setLineWidth(0.2);
      doc.line(210, currentY + 26, 250, currentY + 26);

      doc.save(`BNBA_Ngumbul_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Gagal membuat PDF. Pastikan koneksi internet stabil.");
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
        alert(`Berhasil mengimpor ${newResidents.length} data penduduk.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        alert('Gagal mengimpor file.');
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleArchiveMove = (destination: string, date: string) => {
    if (!movingFamily) return;
    setResidents(prev => prev.map(r => 
      r.noKK === movingFamily.noKK ? {
        ...r, 
        status: 'Pindah' as ResidentStatus, 
        moveDestination: destination, 
        moveDate: date
      } : r
    ));
    setMovingFamily(null);
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-10">
      {(isImporting || isPreparingPDF) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md no-print">
          <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-sm">
             <Loader2 className="mx-auto text-blue-600 animate-spin mb-4" size={56} />
             <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                {isPreparingPDF ? "Menyiapkan PDF..." : "Memproses..."}
             </h3>
             <p className="text-slate-500 text-[10px] font-bold mt-2 leading-relaxed uppercase">Mohon tunggu sejenak.</p>
          </div>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 no-print">
        <div className="flex items-center bg-slate-100 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3 border border-slate-200 w-full lg:max-w-xs focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 transition-all shrink-0">
          <Search size={16} className="text-slate-400 mr-2 md:mr-3 shrink-0" />
          <input 
            type="text" 
            placeholder="Cari Nama/NIK/KK..."
            className="bg-transparent border-none outline-none text-xs md:text-sm w-full font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center flex-wrap gap-2 justify-center lg:justify-end">
          <button 
            onClick={handleDownloadPDF} 
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl md:rounded-2xl text-[9px] font-black hover:bg-red-700 transition-all uppercase tracking-widest shadow-md"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Unduh PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <button onClick={handleDownloadCSV} className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl md:rounded-2xl text-[9px] font-black text-emerald-700 hover:bg-emerald-100 transition-all uppercase tracking-widest">
            <Download size={14} />
            <span className="hidden sm:inline">Ekspor CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
          
          <button onClick={downloadTemplate} className="flex items-center space-x-1.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl md:rounded-2xl text-[9px] font-black text-slate-700 hover:bg-slate-50 transition-all uppercase tracking-widest">
            <BookOpen size={14} />
            <span className="hidden sm:inline">Format</span>
            <span className="sm:hidden">FMT</span>
          </button>
          
          <label className="flex items-center space-x-1.5 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl md:rounded-2xl text-[9px] font-black text-blue-700 hover:bg-blue-100 transition-all cursor-pointer uppercase tracking-widest">
            <Upload size={14} />
            <span className="hidden sm:inline">Import</span>
            <span className="sm:hidden">IMP</span>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleImport} accept=".csv" />
          </label>

          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl md:rounded-2xl text-[9px] font-black hover:bg-slate-800 transition-all shadow-md uppercase tracking-widest">
            <Plus size={16} />
            <span>Tambah KK</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="flex items-center space-x-2 md:space-x-3 bg-white p-2 md:p-3 rounded-xl md:rounded-[2rem] border border-slate-200 shadow-sm no-print overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 min-w-[120px]">
           <MapPin size={12} className="text-slate-400 mr-2" />
           <select className="bg-transparent text-[10px] md:text-xs font-black uppercase outline-none w-full" value={filters.dusun} onChange={(e) => setFilters({ ...filters, dusun: e.target.value, rw: '', rt: '' })}>
             <option value="">Dusun</option>
             {dusunList.map(d => <option key={d} value={d}>{d}</option>)}
           </select>
        </div>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 min-w-[80px]">
           <span className="text-[9px] font-black text-slate-400 mr-1.5">RW</span>
           <select className="bg-transparent text-[10px] md:text-xs font-black outline-none w-full" value={filters.rw} onChange={(e) => setFilters({ ...filters, rw: e.target.value, rt: '' })} disabled={!filters.dusun}>
             <option value="">--</option>
             {rwList.map(rw => <option key={rw} value={rw}>{rw}</option>)}
           </select>
        </div>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 min-w-[80px]">
           <span className="text-[9px] font-black text-slate-400 mr-1.5">RT</span>
           <select className="bg-transparent text-[10px] md:text-xs font-black outline-none w-full" value={filters.rt} onChange={(e) => setFilters({ ...filters, rt: e.target.value })} disabled={!filters.rw}>
             <option value="">--</option>
             {rtList.map(rt => <option key={rt} value={rt}>{rt}</option>)}
           </select>
        </div>
        <button onClick={() => setFilters({ dusun: '', rw: '', rt: '' })} className="p-2 text-slate-400 hover:text-slate-900 transition-all shrink-0"><RefreshCcw size={14} /></button>
        <div className="hidden sm:flex ml-auto items-center space-x-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pr-2">
          <Info size={12} />
          <span>{filteredData.length} KK</span>
        </div>
      </div>

      {/* Screen Table */}
      <div className="bg-white rounded-xl md:rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 w-10 text-center">
                  <button onClick={() => selectedIds.length === filteredData.length ? setSelectedIds([]) : setSelectedIds(filteredData.map(r => r.id))} className="text-slate-400">
                    {selectedIds.length === filteredData.length && filteredData.length > 0 ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-40">Aksi</th>
                <th className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Alamat</th>
                <th className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identitas</th>
                <th className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Kepala Keluarga</th>
                <th className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Profil</th>
                <th className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Kerja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((r) => (
                <tr key={r.id} className="hover:bg-blue-50/20 transition-all">
                  <td className="px-4 py-5 text-center">
                    <button onClick={() => setSelectedIds(prev => prev.includes(r.id) ? prev.filter(i => i !== r.id) : [...prev, r.id])} className="text-slate-200">
                      {selectedIds.includes(r.id) ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                    </button>
                  </td>
                  <td className="px-3 py-5">
                    <div className="flex items-center justify-center space-x-1">
                      <button onClick={() => setViewingFamilyKK(r.noKK)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Anggota"><Eye size={14} /></button>
                      <button onClick={() => setEditingResident(r)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="Edit"><Edit3 size={14} /></button>
                      <button onClick={() => setMovingFamily(r)} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-sm" title="Pindah"><PlaneLanding size={14} /></button>
                      <button onClick={() => setDeletingFamily({ item: r })} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Hapus"><Trash2 size={14} /></button>
                    </div>
                  </td>
                  <td className="px-3 py-5">
                    <div className="text-[11px] font-black text-slate-800">{r.dusun}</div>
                    <div className="text-[9px] text-slate-400 font-bold">RT {r.rt} / RW {r.rw}</div>
                  </td>
                  <td className="px-3 py-5">
                    <div className="text-[11px] font-black text-blue-600 truncate max-w-[100px]" onClick={() => setViewingFamilyKK(r.noKK)}>{r.noKK}</div>
                    <div className="text-[9px] text-slate-400 font-mono">{r.nik}</div>
                  </td>
                  <td className="px-3 py-5 text-[11px] font-black text-slate-800 uppercase max-w-[150px] truncate">{r.fullName}</td>
                  <td className="px-3 py-5 text-center">
                    <div className="text-[11px] font-black text-slate-900">{calculateAge(r.birthDate)} <span className="text-[9px] font-normal text-slate-400">Thn</span></div>
                    <div className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${r.gender.includes('Perempuan') ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                      {r.gender.includes('Laki') ? 'L' : 'P'}
                    </div>
                  </td>
                  <td className="px-3 py-5 text-[10px] text-slate-500 font-medium truncate max-w-[120px]">{r.job || '-'}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">Data tidak ditemukan.</td>
                </tr>
              )}
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
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-2xl w-full max-sm overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center uppercase font-black tracking-widest text-[10px] md:text-xs">
               <span>Konfirmasi Hapus</span>
               <button onClick={() => setDeletingFamily(null)}><X size={20}/></button>
            </div>
            <div className="p-6 md:p-8 space-y-4">
               <div className="text-center bg-rose-50 p-4 rounded-xl border border-rose-100">
                 <p className="text-[9px] font-black text-rose-600 uppercase mb-1.5 tracking-widest">Data Akan Dipindahkan ke Arsip</p>
                 <h5 className="text-sm md:text-base font-black text-slate-900 uppercase leading-tight">{deletingFamily.item.fullName}</h5>
               </div>
               <div className="space-y-2.5">
                 <button onClick={() => {
                    setResidents(prev => prev.map(r => r.noKK === deletingFamily.item.noKK ? {...r, status: 'Terhapus' as ResidentStatus, deleteDate: new Date().toISOString().split('T')[0], deleteReason: 'Hapus via Mobile'} : r));
                    setDeletingFamily(null);
                 }} className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-black text-xs uppercase shadow-lg hover:bg-rose-700 transition-all">Konfirmasi Hapus</button>
                 <button onClick={() => setDeletingFamily(null)} className="w-full py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Batal</button>
               </div>
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
      <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95">
        <div className="p-5 bg-amber-500 text-white flex justify-between items-center uppercase font-black tracking-widest text-[10px] md:text-xs">
           <div className="flex items-center space-x-2">
             <PlaneLanding size={16} />
             <span>Lapor Pindah</span>
           </div>
           <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6 md:p-8 space-y-5">
           <div className="text-center bg-amber-50 p-4 rounded-xl border border-amber-100">
             <h5 className="text-sm md:text-base font-black text-slate-900 uppercase leading-tight">{item.fullName}</h5>
             <p className="text-[9px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">KK: {item.noKK}</p>
           </div>
           <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tujuan Pindah</label>
                <input type="text" value={dest} onChange={e => setDest(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs outline-none focus:bg-white transition-all uppercase" placeholder="Nama Kota/Kec/Desa" required />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tanggal</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs outline-none focus:bg-white transition-all" required />
              </div>
           </div>
           <div className="space-y-2.5">
              <button onClick={() => dest.trim() ? onConfirm(dest, date) : alert("Isi tujuan!")} className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-black text-xs uppercase shadow-lg hover:bg-amber-600 transition-all">Konfirmasi Pindah</button>
              <button onClick={onClose} className="w-full py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Kembali</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PopulationManagement;
