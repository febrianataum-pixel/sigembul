
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Baby, 
  Plus, 
  MapPin, 
  Info, 
  X, 
  Save, 
  User, 
  // Added Users to fix the error in SelectKKModal
  Users,
  FileText, 
  Eye, 
  Calendar, 
  Clock, 
  Download, 
  Printer,
  ChevronRight,
  Filter
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Resident, ResidentStatus, BloodType, MaritalStatus, Education } from '../types';
import { calculateAge, formatDate } from '../utils/helpers';
import EditResidentModal from './EditResidentModal';

interface BirthManagementProps {
  residents: Resident[];
  setResidents: React.Dispatch<React.SetStateAction<Resident[]>>;
}

const BirthManagement: React.FC<BirthManagementProps> = ({ residents, setResidents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dusunFilter, setDusunFilter] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<Resident | null>(null);
  const [isBirthFormOpen, setIsBirthFormOpen] = useState(false);
  const [isSelectingKK, setIsSelectingKK] = useState(false);
  const [viewingBaby, setViewingBaby] = useState<Resident | null>(null);

  // Daftar Dusun untuk filter
  const dusunList = useMemo(() => 
    Array.from(new Set(residents.filter(r => r.status === 'Aktif').map(r => r.dusun))).sort()
  , [residents]);

  // Filter untuk menampilkan bayi yang sudah diinput (Usia 0-1 tahun)
  const registeredBirths = useMemo(() => {
    return residents
      .filter(r => r.status === 'Aktif' && calculateAge(r.birthDate) <= 1)
      .filter(r => !dusunFilter || r.dusun === dusunFilter)
      .filter(r => 
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.nik.includes(searchTerm) ||
        r.noKK.includes(searchTerm)
      )
      .sort((a, b) => new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime());
  }, [residents, dusunFilter, searchTerm]);

  const handleRegisterBirth = (family: Resident) => {
    setSelectedFamily(family);
    setIsBirthFormOpen(true);
    setIsSelectingKK(false);
  };

  const handleExportPDF = () => {
    if (registeredBirths.length === 0) return alert("Tidak ada data untuk diekspor.");
    
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PEMERINTAH KABUPATEN BLORA', 148.5, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('KECAMATAN TODANAN - DESA NGUMBUL', 148.5, 21, { align: 'center' });
    doc.setFontSize(11);
    doc.text('BUKU REGISTER KELAHIRAN PENDUDUK', 148.5, 30, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(20, 32, 277, 32);

    const tableData = registeredBirths.map((b, idx) => [
      idx + 1,
      b.fullName.toUpperCase(),
      b.nik,
      b.noKK,
      formatDate(b.birthDate),
      b.gender.includes('Laki') ? 'L' : 'P',
      b.fatherName.toUpperCase(),
      b.motherName.toUpperCase(),
      `${b.dusun} RT ${b.rt}/RW ${b.rw}`
    ]);

    autoTable(doc, {
      head: [['NO', 'NAMA BAYI', 'NIK', 'NOMOR KK', 'TGL LAHIR', 'JK', 'NAMA AYAH', 'NAMA IBU', 'ALAMAT']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129], halign: 'center' },
    });

    doc.save(`Data_Kelahiran_Ngumbul_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Main Actions */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Baby size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Manajemen Kelahiran</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 tracking-widest">Pencatatan dan Monitoring Bayi Baru Lahir</p>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-3">
             <button 
              onClick={() => setIsSelectingKK(true)}
              className="flex items-center space-x-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200"
            >
              <Plus size={18} />
              <span>Daftar Kelahiran Baru</span>
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center space-x-2 px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              <Download size={18} />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex-1 flex items-center bg-slate-50 rounded-2xl px-5 py-3 border border-slate-100 w-full focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
          <Search size={18} className="text-slate-400 mr-3" />
          <input 
            type="text" 
            placeholder="Cari Nama Bayi / NIK / No. KK..."
            className="bg-transparent border-none outline-none text-sm w-full font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 min-w-[200px] w-full md:w-auto">
           <MapPin size={16} className="text-slate-400 mr-2" />
           <select 
             className="bg-transparent text-xs font-black uppercase outline-none w-full"
             value={dusunFilter}
             onChange={(e) => setDusunFilter(e.target.value)}
           >
             <option value="">Semua Dusun</option>
             {dusunList.map(d => <option key={d} value={d}>{d}</option>)}
           </select>
        </div>
      </div>

      {/* History Table Section */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Data Kelahiran Terdaftar</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Daftar bayi usia 0-1 tahun di Desa Ngumbul</p>
            </div>
          </div>
          <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            {registeredBirths.length} Bayi Ditemukan
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">No</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Biodata Bayi</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas Dokumen</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">JK / Usia</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Orang Tua</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Wilayah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registeredBirths.length > 0 ? registeredBirths.map((baby, idx) => (
                <tr key={baby.id} className="hover:bg-emerald-50/20 transition-all group">
                  <td className="px-8 py-6 text-center text-xs font-black text-slate-300">{idx + 1}</td>
                  <td className="px-6 py-6">
                    <button 
                      onClick={() => setViewingBaby(baby)}
                      className="flex items-center space-x-3 text-left group-hover:translate-x-1 transition-transform"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${baby.gender.includes('Laki') ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                        <Baby size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tighter hover:text-emerald-600 hover:underline">{baby.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{formatDate(baby.birthDate)}</div>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-xs font-bold text-blue-600 font-mono tracking-tighter">NIK: {baby.nik}</div>
                    <div className="text-[10px] text-slate-400 font-mono tracking-tighter">KK: {baby.noKK}</div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase mb-1 inline-block ${baby.gender.includes('Laki') ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {baby.gender.includes('Laki') ? 'Laki-laki' : 'Perempuan'}
                    </span>
                    <div className="text-[10px] font-black text-slate-900 uppercase">{calculateAge(baby.birthDate)} Thn</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">A: {baby.fatherName || '-'}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">I: {baby.motherName || '-'}</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-[11px] font-black text-slate-700 uppercase">{baby.dusun}</div>
                    <div className="text-[9px] text-slate-400 font-black uppercase">RT {baby.rt} / RW {baby.rw}</div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="max-w-xs mx-auto">
                      <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data kelahiran tidak ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals Section */}
      {isSelectingKK && (
        <SelectKKModal 
          residents={residents} 
          onClose={() => setIsSelectingKK(false)} 
          onSelect={handleRegisterBirth} 
        />
      )}

      {isBirthFormOpen && selectedFamily && (
        <BirthFormModal 
          family={selectedFamily} 
          residents={residents}
          onClose={() => setIsBirthFormOpen(false)} 
          onSave={(newBaby) => {
            setResidents(prev => [...prev, newBaby]);
            setIsBirthFormOpen(false);
            alert(`Berhasil mendaftarkan kelahiran: ${newBaby.fullName}`);
          }}
        />
      )}

      {viewingBaby && (
        <EditResidentModal 
          resident={viewingBaby} 
          onClose={() => setViewingBaby(null)} 
          onSave={(updated) => {
            setResidents(prev => prev.map(r => r.id === updated.id ? updated : r));
            setViewingBaby(null);
          }} 
        />
      )}
    </div>
  );
};

// Modal Baru untuk Pilih KK
const SelectKKModal: React.FC<{ residents: Resident[], onClose: () => void, onSelect: (r: Resident) => void }> = ({ residents, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  
  const filteredKK = useMemo(() => {
    return residents
      .filter(r => r.isHeadOfFamily && r.status === 'Aktif')
      .filter(r => 
        r.fullName.toLowerCase().includes(query.toLowerCase()) || 
        r.noKK.includes(query)
      ).slice(0, 5);
  }, [residents, query]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Users size={20} />
            <span className="text-sm font-black uppercase tracking-widest">Pilih Kepala Keluarga</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-all"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-slate-100 rounded-2xl px-5 py-3.5 border border-slate-200 flex items-center focus-within:bg-white transition-all">
            <Search size={18} className="text-slate-400 mr-3" />
            <input 
              autoFocus
              type="text" 
              placeholder="Cari Nama / No. KK..."
              className="bg-transparent border-none outline-none text-sm w-full font-bold"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          
          <div className="space-y-3">
             {filteredKK.length > 0 ? filteredKK.map(kk => (
               <button 
                 key={kk.id} 
                 onClick={() => onSelect(kk)}
                 className="w-full text-left p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
               >
                 <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase">{kk.fullName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">KK: {kk.noKK}</p>
                    </div>
                    <div className="text-[9px] font-black text-slate-400 uppercase bg-white px-2 py-1 rounded-lg border border-slate-200">
                      {kk.dusun}
                    </div>
                 </div>
                 <div className="mt-3 flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Pilih & Lanjut <ChevronRight size={12} className="ml-1" />
                 </div>
               </button>
             )) : (
               <div className="py-10 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ketik untuk mencari Kepala Keluarga...</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface BirthFormModalProps {
  family: Resident;
  residents: Resident[];
  onClose: () => void;
  onSave: (baby: Resident) => void;
}

const BirthFormModal: React.FC<BirthFormModalProps> = ({ family, residents, onClose, onSave }) => {
  const mother = residents.find(r => r.noKK === family.noKK && r.relationship.includes('Istri'));
  
  const [formData, setFormData] = useState({
    nik: '',
    fullName: '',
    gender: '1. Laki-laki' as any,
    birthDate: new Date().toISOString().split('T')[0],
    bloodType: 'Tidak tahu' as BloodType,
    fatherName: family.fullName,
    motherName: mother?.fullName || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nik.length !== 16) return alert("NIK harus 16 digit!");
    
    const baby: Resident = {
      id: `birth-${Date.now()}`,
      dusun: family.dusun,
      rt: family.rt,
      rw: family.rw,
      noKK: family.noKK,
      nik: formData.nik,
      fullName: formData.fullName.toUpperCase(),
      relationship: '3. Anak Kandung/Tiri',
      birthPlace: 'BLORA',
      birthDate: formData.birthDate,
      gender: formData.gender,
      bloodType: formData.bloodType,
      maritalStatus: '1. Belum kawin' as MaritalStatus,
      education: '1. Tidak/belum pernah sekolah' as Education,
      job: '22. Pelajar/Mahasiswa',
      fatherName: formData.fatherName,
      motherName: formData.motherName,
      isHeadOfFamily: false,
      status: 'Aktif'
    };
    onSave(baby);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center space-x-4">
             <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Baby size={24} />
             </div>
             <div>
                <h3 className="text-lg font-black uppercase tracking-tight leading-none">Form Data Kelahiran</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">KK: {family.noKK}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-all"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50/20">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">Nama Lengkap Bayi</label>
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={e => setFormData({...formData, fullName: e.target.value})} 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-black uppercase outline-none focus:ring-4 focus:ring-emerald-500/10" 
                  placeholder="NAMA LENGKAP BAYI"
                  required 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">NIK Bayi (16 Digit)</label>
                <input 
                  type="text" 
                  value={formData.nik} 
                  onChange={e => setFormData({...formData, nik: e.target.value.replace(/\D/g, '').slice(0, 16)})} 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold outline-none" 
                  placeholder="3316..."
                  required 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">Jenis Kelamin</label>
                <select 
                  value={formData.gender} 
                  onChange={e => setFormData({...formData, gender: e.target.value as any})}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold outline-none"
                >
                  <option value="1. Laki-laki">1. Laki-laki</option>
                  <option value="2. Perempuan">2. Perempuan</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">Tanggal Lahir</label>
                <input 
                  type="date" 
                  value={formData.birthDate} 
                  onChange={e => setFormData({...formData, birthDate: e.target.value})} 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">Golongan Darah</label>
                <select 
                  value={formData.bloodType} 
                  onChange={e => setFormData({...formData, bloodType: e.target.value as BloodType})}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold outline-none"
                >
                  <option value="Tidak tahu">Tidak tahu</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Informasi Orang Tua</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1 uppercase">Nama Ayah</label>
                      <input type="text" value={formData.fatherName} readOnly className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-500 uppercase" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 block mb-1 uppercase">Nama Ibu</label>
                      <input 
                        type="text" 
                        value={formData.motherName} 
                        onChange={e => setFormData({...formData, motherName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase outline-none" 
                      />
                    </div>
                 </div>
              </div>
           </div>

           <div className="pt-8 flex items-center justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">Batal</button>
              <button type="submit" className="px-12 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black uppercase shadow-xl hover:bg-emerald-700 transition-all flex items-center space-x-3">
                <Save size={18} />
                <span>Simpan Bayi</span>
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default BirthManagement;
