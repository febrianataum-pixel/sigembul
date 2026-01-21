
import React, { useState, useMemo } from 'react';
import { Search, MapPin, Skull, PlaneLanding, History, Trash2, Calendar, FileText, Eye, AlertTriangle, MessageSquare } from 'lucide-react';
import { Resident, ResidentStatus } from '../types';
import { calculateAge, formatDate } from '../utils/helpers';
import FamilyDetailModal from './FamilyDetailModal';

interface ArchivedResidentsProps {
  residents: Resident[];
  setResidents: React.Dispatch<React.SetStateAction<Resident[]>>;
}

const ArchivedResidents: React.FC<ArchivedResidentsProps> = ({ residents, setResidents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [subTab, setSubTab] = useState<'Meninggal' | 'Pindah' | 'Terhapus'>('Meninggal');
  const [viewingFamilyKK, setViewingFamilyKK] = useState<string | null>(null);
  
  const filteredArchivedData = useMemo(() => {
    return residents.filter(r => {
      const matchStatus = r.status === subTab;
      // Untuk Pindah dan Terhapus (jika dihapus satu keluarga), tampilkan kepala keluarga saja di list utama
      const matchLevel = (subTab === 'Pindah' || subTab === 'Terhapus') ? r.isHeadOfFamily : true;
      const matchSearch = 
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.nik.includes(searchTerm) ||
        r.noKK.includes(searchTerm);
      return matchStatus && matchLevel && matchSearch;
    });
  }, [residents, searchTerm, subTab]);

  const restoreData = (item: Resident) => {
    const msg = (subTab === 'Pindah' || subTab === 'Terhapus')
      ? `Pulihkan data keluarga ${item.fullName} (KK: ${item.noKK}) ke status Aktif?`
      : `Pulihkan ${item.fullName} ke status Aktif?`;

    if (window.confirm(msg)) {
      setResidents(prev => prev.map(r => {
        // Tentukan apakah record ini harus dipulihkan berdasarkan tab aktif
        const isTargetRecord = (subTab === 'Pindah' || subTab === 'Terhapus') 
          ? r.noKK.trim() === item.noKK.trim() 
          : r.id === item.id;
        
        if (isTargetRecord && r.status === subTab) {
          return { 
            ...r, 
            status: 'Aktif' as ResidentStatus, 
            deathDate: undefined, 
            moveDate: undefined, 
            moveDestination: undefined,
            deleteDate: undefined,
            deleteReason: undefined
          };
        }
        return r;
      }));
    }
  };

  const deletePermanently = (item: Resident) => {
    const msg = (subTab === 'Pindah' || subTab === 'Terhapus')
      ? `Hapus PERMANEN keluarga ${item.fullName}? Data akan benar-benar dibuang dari sistem!`
      : `Hapus PERMANEN data ${item.fullName}? Data akan benar-benar dibuang dari sistem!`;

    if (window.confirm(msg)) {
      setResidents(prev => prev.filter(r => {
        const shouldDelete = (subTab === 'Pindah' || subTab === 'Terhapus') ? r.noKK.trim() === item.noKK.trim() : r.id === item.id;
        if (shouldDelete && r.status === subTab) return false;
        return true;
      }));
    }
  };

  const tabConfigs = {
    Meninggal: { color: 'bg-rose-600', icon: Skull, label: 'Data Kematian' },
    Pindah: { color: 'bg-amber-500', icon: PlaneLanding, label: 'Data Pindah (KK)' },
    Terhapus: { color: 'bg-slate-700', icon: AlertTriangle, label: 'Riwayat Terhapus' }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-fit overflow-x-auto scrollbar-hide">
        {(Object.keys(tabConfigs) as Array<keyof typeof tabConfigs>).map(tabKey => {
          const Config = tabConfigs[tabKey];
          return (
            <button 
              key={tabKey}
              onClick={() => setSubTab(tabKey)} 
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${subTab === tabKey ? `${Config.color} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Config.icon size={14} />
              <span>{Config.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center bg-slate-50 rounded-2xl px-5 py-3 border border-slate-100 max-w-md w-full">
          <Search size={18} className="text-slate-400 mr-3" />
          <input type="text" placeholder={`Cari di arsip ${subTab.toLowerCase()}...`} className="bg-transparent border-none outline-none text-sm w-full font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
           Menampilkan {filteredArchivedData.length} entitas arsip
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className={`${subTab === 'Meninggal' ? 'bg-rose-50' : subTab === 'Pindah' ? 'bg-amber-50' : 'bg-slate-50'} border-b border-slate-100`}>
              <tr>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Kependudukan</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Nama Lengkap</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Tgl Peristiwa</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Keterangan / Alasan</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArchivedData.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-6">
                    <div className="text-[10px] font-bold text-blue-600 font-mono tracking-tighter">{r.noKK}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{r.nik}</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-sm font-black uppercase text-slate-800">{r.fullName}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">{r.dusun} | {r.relationship.includes('. ') ? r.relationship.split('. ')[1] : r.relationship}</div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
                       <Calendar size={12} className="text-slate-400" />
                       <span className="text-[11px] font-black text-slate-700">{formatDate(subTab === 'Meninggal' ? r.deathDate! : subTab === 'Pindah' ? r.moveDate! : r.deleteDate!)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-start space-x-2 max-w-xs">
                       <MessageSquare size={14} className="text-slate-300 mt-1 shrink-0" />
                       <div className="text-xs font-bold text-slate-500 leading-relaxed italic">
                        {subTab === 'Pindah' ? `Pindah ke: ${r.moveDestination}` : subTab === 'Meninggal' ? 'Kematian Penduduk' : r.deleteReason || 'Tanpa alasan'}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-center space-x-2">
                       {(subTab === 'Pindah' || subTab === 'Terhapus') && <button onClick={() => setViewingFamilyKK(r.noKK)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="Lihat Anggota"><Eye size={16} /></button>}
                       <button onClick={() => restoreData(r)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Pulihkan Data"><History size={16} /></button>
                       <button onClick={() => deletePermanently(r)} className="p-2.5 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Hapus Permanen"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredArchivedData.length === 0 && (
                <tr>
                   <td colSpan={5} className="py-24 text-center">
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[3rem] p-12 inline-block">
                         <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arsip {subTab} Masih Kosong</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {viewingFamilyKK && <FamilyDetailModal noKK={viewingFamilyKK} residents={residents} setResidents={setResidents} onClose={() => setViewingFamilyKK(null)} />}
    </div>
  );
};

export default ArchivedResidents;
