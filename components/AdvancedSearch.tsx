
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Filter, 
  Download, 
  X, 
  RefreshCcw, 
  ChevronRight,
  User,
  Eye,
  Calendar,
  Layers,
  Baby,
  Heart
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Resident, AppConfig } from '../types';
import { calculateAge, formatDate } from '../utils/helpers';
import FamilyDetailModal from './FamilyDetailModal';

interface AdvancedSearchProps {
  residents: Resident[];
  setResidents: React.Dispatch<React.SetStateAction<Resident[]>>;
  config: AppConfig;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ residents, setResidents, config }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDusun, setSelectedDusun] = useState('');
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedMarital, setSelectedMarital] = useState('');
  const [selectedEducation, setSelectedEducation] = useState('');
  const [viewingFamilyKK, setViewingFamilyKK] = useState<string | null>(null);

  const dusunList = useMemo(() => Array.from(new Set(residents.map(r => r.dusun))).sort(), [residents]);
  const educationList = useMemo(() => Array.from(new Set(residents.map(r => r.education))).sort(), [residents]);
  const maritalList = useMemo(() => Array.from(new Set(residents.map(r => r.maritalStatus))).sort(), [residents]);

  const filteredData = useMemo(() => {
    return residents.filter(r => {
      const age = calculateAge(r.birthDate);
      
      const matchSearch = searchTerm === '' || 
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.nik.includes(searchTerm) || 
        r.noKK.includes(searchTerm);
        
      const matchDusun = selectedDusun === '' || r.dusun === selectedDusun;
      
      const matchAge = selectedAge === '' || age === parseInt(selectedAge);
      
      const matchGender = selectedGender === '' || r.gender.includes(selectedGender);
      
      const matchMarital = selectedMarital === '' || r.maritalStatus === selectedMarital;
      
      const matchEducation = selectedEducation === '' || r.education === selectedEducation;

      return matchSearch && matchDusun && matchAge && matchGender && matchMarital && matchEducation;
    }).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [residents, searchTerm, selectedDusun, selectedAge, selectedGender, selectedMarital, selectedEducation]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDusun('');
    setSelectedAge('');
    setSelectedGender('');
    setSelectedMarital('');
    setSelectedEducation('');
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return alert("Tidak ada data untuk dicetak.");
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PEMERINTAH KABUPATEN BLORA', 148.5, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('KECAMATAN TODANAN - DESA NGUMBUL', 148.5, 21, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(20, 28, 277, 28);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN HASIL PENCARIAN DATA PENDUDUK', 148.5, 38, { align: 'center' });

    // Filter Info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    let filterSummary = `Wilayah: ${selectedDusun || 'Seluruh Desa'}`;
    if (selectedAge) filterSummary += ` | Usia: ${selectedAge} Tahun`;
    if (selectedGender) filterSummary += ` | JK: ${selectedGender}`;
    if (selectedMarital) filterSummary += ` | Status: ${selectedMarital}`;
    
    doc.text(filterSummary, 20, 45);
    doc.text(`Jumlah: ${filteredData.length} Jiwa`, 277, 45, { align: 'right' });

    const tableData = filteredData.map((r, idx) => [
      idx + 1,
      r.fullName.toUpperCase(),
      r.nik,
      r.noKK,
      `${r.dusun} RT ${r.rt}/RW ${r.rw}`,
      r.gender.includes('Laki') ? 'L' : 'P',
      calculateAge(r.birthDate),
      r.relationship.split('. ').pop() || r.relationship,
      r.education.split('. ').pop() || r.education
    ]);

    autoTable(doc, {
      head: [['NO', 'NAMA LENGKAP', 'NIK', 'NOMOR KK', 'ALAMAT', 'JK', 'USIA', 'HUBUNGAN', 'PENDIDIKAN']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.text(`Ngumbul, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 230, finalY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('KEPALA DESA NGUMBUL', 230, finalY + 5, { align: 'center' });
    doc.text(config.villageHeadName.toUpperCase(), 230, finalY + 25, { align: 'center' });

    doc.save(`Pencarian_SIGA_Ngumbul_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Filter size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Pencarian Lanjut</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Filter multi-indikator & export data spesifik</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportPDF}
              className="flex items-center space-x-2 px-6 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200"
            >
              <Download size={18} />
              <span>Ekspor PDF</span>
            </button>
            <button 
              onClick={resetFilters}
              className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all"
              title="Reset Filter"
            >
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="md:col-span-2 lg:col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nama / NIK / No. KK</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="Cari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pilih Dusun</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none focus:bg-white transition-all appearance-none"
                value={selectedDusun}
                onChange={(e) => setSelectedDusun(e.target.value)}
              >
                <option value="">Semua Wilayah</option>
                {dusunList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Usia (Tahun)</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="number" 
                min="0"
                max="150"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none focus:bg-white transition-all"
                placeholder="Contoh: 1"
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Jenis Kelamin</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none focus:bg-white transition-all appearance-none"
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
              >
                <option value="">Semua Gender</option>
                <option value="Laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status Kawin</label>
            <div className="relative">
              <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none focus:bg-white transition-all appearance-none"
                value={selectedMarital}
                onChange={(e) => setSelectedMarital(e.target.value)}
              >
                <option value="">Semua Status</option>
                {maritalList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pendidikan</label>
            <div className="relative">
              <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none focus:bg-white transition-all appearance-none"
                value={selectedEducation}
                onChange={(e) => setSelectedEducation(e.target.value)}
              >
                <option value="">Semua Tingkat</option>
                {educationList.map(edu => <option key={edu} value={edu}>{edu}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Daftar Hasil Pencarian</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ditemukan {filteredData.length} jiwa sesuai filter</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">No</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Penduduk</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas Dokumen</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">JK / Usia</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hubungan</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? filteredData.map((resident, idx) => (
                <tr key={resident.id} className="hover:bg-blue-50/20 transition-all group">
                  <td className="px-8 py-6 text-center text-xs font-black text-slate-300">{idx + 1}</td>
                  <td className="px-6 py-6">
                    <div>
                      <div className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none">{resident.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{resident.birthPlace}, {formatDate(resident.birthDate)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-[10px] font-bold text-blue-600 font-mono tracking-tighter">NIK: {resident.nik}</div>
                    <div className="text-[9px] text-slate-400 font-mono tracking-tighter">KK: {resident.noKK}</div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase mb-1 inline-block ${resident.gender.includes('Laki') ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {resident.gender.includes('Laki') ? 'L' : 'P'}
                    </span>
                    <div className="text-[10px] font-black text-slate-900 uppercase">{calculateAge(resident.birthDate)} Thn</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-[10px] text-slate-700 font-black uppercase">{resident.relationship.split('. ').pop()}</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-[10px] font-black text-slate-700 uppercase">{resident.dusun}</div>
                    <div className="text-[9px] text-slate-400 font-black uppercase">RT {resident.rt} / RW {resident.rw}</div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <button 
                      onClick={() => setViewingFamilyKK(resident.noKK)}
                      className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" 
                      title="Lihat Keluarga"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="max-w-xs mx-auto">
                      <Search size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tidak ada data ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingFamilyKK && (
        <FamilyDetailModal 
          noKK={viewingFamilyKK} 
          residents={residents} 
          setResidents={setResidents} 
          onClose={() => setViewingFamilyKK(null)} 
        />
      )}
    </div>
  );
};

export default AdvancedSearch;
