
import React, { useState } from 'react';
import { X, User, Printer, UserPlus, Skull, Trash2, Calendar, Users, Save, PlaneLanding, HeartPulse } from 'lucide-react';
import { Resident, ResidentStatus } from '../types';
import { calculateAge } from '../utils/helpers';
import EditResidentModal from './EditResidentModal';

interface FamilyDetailModalProps {
  noKK: string;
  residents: Resident[];
  setResidents: React.Dispatch<React.SetStateAction<Resident[]>>;
  onClose: () => void;
}

const FamilyDetailModal: React.FC<FamilyDetailModalProps> = ({ noKK, residents, setResidents, onClose }) => {
  const [editingMember, setEditingMember] = useState<Resident | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [deathConfirm, setDeathConfirm] = useState<Resident | null>(null);
  const [deletingMember, setDeletingMember] = useState<Resident | null>(null);
  const [pregnancyConfirm, setPregnancyConfirm] = useState<Resident | null>(null);
  
  const targetNoKK = noKK.trim();
  const headRef = residents.find(r => r.noKK.trim() === targetNoKK && r.isHeadOfFamily);
  const currentViewStatus = headRef?.status || 'Aktif';
  
  const familyMembers = residents.filter(r => r.noKK.trim() === targetNoKK && r.status === currentViewStatus);
  const headOfFamily = familyMembers.find(r => r.isHeadOfFamily) || familyMembers[0];

  const finalizeDeleteMember = (reason: string) => {
    if (!deletingMember) return;
    setResidents(prev => {
      const updated = prev.map(r => {
        if (r.id === deletingMember.id) {
          return { 
            ...r, 
            status: 'Terhapus' as ResidentStatus, 
            deleteDate: new Date().toISOString().split('T')[0],
            deleteReason: reason
          };
        }
        return r;
      });
      
      const remainingInKK = updated.filter(r => r.noKK.trim() === targetNoKK && r.status === currentViewStatus);
      if (remainingInKK.length === 0) onClose();
      
      return updated;
    });
    setDeletingMember(null);
  };

  const archiveDeath = (date: string) => {
    if (!deathConfirm) return;
    setResidents(prev => prev.map(r => 
      r.id === deathConfirm.id ? { ...r, status: 'Meninggal' as ResidentStatus, deathDate: date, isPregnant: false } : r
    ));
    setDeathConfirm(null);
  };

  const handleArchivePregnancy = (date: string) => {
    if (!pregnancyConfirm) return;
    setResidents(prev => prev.map(r => 
      r.id === pregnancyConfirm.id ? { ...r, isPregnant: true, pregnancyStartDate: date } : r
    ));
    setPregnancyConfirm(null);
  };

  const handleUpdateMember = (updated: Resident) => {
    setResidents(prev => prev.map(r => r.id === updated.id ? updated : r));
    setEditingMember(null);
  };

  const handleAddMember = (newMember: Resident) => {
    setResidents(prev => [...prev, { ...newMember, status: 'Aktif' as ResidentStatus }]);
    setIsAddingMember(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95">
        
        {/* Header Modal */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between no-print">
          <div className="flex items-center space-x-6">
            <div className={`w-14 h-14 ${currentViewStatus === 'Pindah' ? 'bg-amber-500' : currentViewStatus === 'Terhapus' ? 'bg-slate-700' : 'bg-slate-900'} rounded-2xl flex items-center justify-center text-white shadow-xl`}>
              <User size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                {currentViewStatus === 'Pindah' ? 'Rincian Keluarga (Pindah)' : currentViewStatus === 'Terhapus' ? 'Rincian Keluarga (Terhapus)' : 'Daftar Anggota Keluarga'}
              </h3>
              <p className="text-slate-400 text-[10px] font-bold font-mono tracking-widest mt-2 uppercase">NO. KK: {noKK}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {currentViewStatus === 'Aktif' && (
              <button onClick={() => setIsAddingMember(true)} className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black hover:bg-emerald-700 transition-all uppercase tracking-widest shadow-lg shadow-emerald-200">
                <UserPlus size={16} />
                <span>Tambah Anggota</span>
              </button>
            )}
            <button onClick={() => window.print()} className="p-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl transition-all" title="Cetak Data"><Printer size={20} /></button>
            <button onClick={onClose} className="p-3 bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><X size={24} /></button>
          </div>
        </div>

        {/* List Anggota */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20">
          <div className="grid grid-cols-1 gap-4">
            {familyMembers.length > 0 ? familyMembers.sort((a,b) => (a.isHeadOfFamily ? -1 : 1)).map((m) => {
              const isFemale = m.gender.includes('Perempuan');
              return (
                <div key={m.id} className="bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center hover:border-blue-200 transition-all group">
                  <div className={`px-6 py-4 md:w-48 text-center md:text-left rounded-2xl md:mr-6 font-black text-[10px] uppercase tracking-widest shadow-sm ${
                    m.isHeadOfFamily 
                      ? (currentViewStatus === 'Pindah' ? 'bg-amber-500 text-white' : currentViewStatus === 'Terhapus' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white') 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {m.relationship.includes('. ') ? m.relationship.split('. ')[1] : m.relationship}
                  </div>

                  <div className="flex-1 p-2 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <button onClick={() => currentViewStatus === 'Aktif' && setEditingMember(m)} className={`text-xs font-black font-mono ${currentViewStatus === 'Aktif' ? 'text-blue-600 hover:underline' : 'text-slate-400'}`}>{m.nik}</button>
                      <h5 className="text-sm font-black text-slate-900 uppercase truncate mt-0.5">{m.fullName}</h5>
                      {m.isPregnant && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black bg-pink-100 text-pink-700 uppercase mt-1 animate-pulse">
                          <HeartPulse size={8} className="mr-1" /> Sedang Hamil
                        </span>
                      )}
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">L/P</p>
                      <span className="text-xs font-bold text-slate-600 uppercase">{m.gender.includes('Laki') ? 'Laki-laki' : 'Perempuan'}</span>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Usia</p>
                      <p className="text-sm font-black text-slate-900">{calculateAge(m.birthDate)} <span className="text-[10px] font-normal text-slate-400 uppercase tracking-tighter">Tahun</span></p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      {currentViewStatus === 'Aktif' && (
                        <>
                          {isFemale && !m.isPregnant && (
                            <button onClick={() => setPregnancyConfirm(m)} className="p-2.5 bg-pink-50 text-pink-500 rounded-xl hover:bg-pink-500 hover:text-white transition-all shadow-sm" title="Lapor Hamil">
                              <HeartPulse size={16} />
                            </button>
                          )}
                          <button onClick={() => setDeathConfirm(m)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="Lapor Kematian"><Skull size={16} /></button>
                          <button onClick={() => setDeletingMember(m)} className="p-2.5 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Pindahkan ke Terhapus"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <Users size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Tidak ada anggota keluarga aktif ditemukan.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-white flex justify-between items-center no-print">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Data dipindahkan ke arsip sesuai jenis peristiwa (Meninggal/Terhapus).</p>
          <button onClick={onClose} className={`px-12 py-4 ${currentViewStatus === 'Pindah' ? 'bg-amber-500' : currentViewStatus === 'Terhapus' ? 'bg-slate-700' : 'bg-slate-900'} text-white rounded-[1.5rem] text-sm font-black hover:opacity-90 shadow-xl transition-all uppercase tracking-widest`}>Tutup Dialog</button>
        </div>

        {editingMember && <EditResidentModal resident={editingMember} onClose={() => setEditingMember(null)} onSave={handleUpdateMember} />}
        {isAddingMember && <InternalAddMemberModal noKK={noKK} familyBase={headOfFamily} onClose={() => setIsAddingMember(false)} onSave={handleAddMember} />}
        {deathConfirm && <DeathModal member={deathConfirm} onClose={() => setDeathConfirm(null)} onConfirm={archiveDeath} />}
        {deletingMember && <MemberDeleteReasonModal member={deletingMember} onClose={() => setDeletingMember(null)} onConfirm={finalizeDeleteMember} />}
        {pregnancyConfirm && <PregnancyModal member={pregnancyConfirm} onClose={() => setPregnancyConfirm(null)} onConfirm={handleArchivePregnancy} />}
      </div>
    </div>
  );
};

const PregnancyModal: React.FC<{ member: Resident, onClose: () => void, onConfirm: (date: string) => void }> = ({ member, onClose, onConfirm }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in zoom-in-95">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="p-6 bg-pink-600 text-white font-black text-sm uppercase tracking-widest flex items-center">
           <HeartPulse size={18} className="mr-3" />
           <span>Konfirmasi Kehamilan</span>
        </div>
        <div className="p-8 space-y-6">
           <div className="text-center bg-pink-50 p-4 rounded-2xl border border-pink-100">
              <p className="text-[10px] text-pink-600 font-black uppercase mb-1 tracking-widest">Monitoring Ibu Hamil Baru</p>
              <p className="text-md font-black uppercase text-slate-900 leading-tight">{member.fullName}</p>
           </div>
           <div className="text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tanggal Mulai Hamil / HPHT</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:bg-white transition-all outline-none" required />
           </div>
           <div className="space-y-3">
              <button onClick={() => onConfirm(date)} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl hover:bg-pink-700 transition-all">Simpan Status Hamil</button>
              <button onClick={onClose} className="w-full py-3 text-center text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">Batal</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const MemberDeleteReasonModal: React.FC<{ member: Resident, onClose: () => void, onConfirm: (reason: string) => void }> = ({ member, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in zoom-in-95">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="p-6 bg-slate-900 text-white font-black text-sm uppercase tracking-widest flex items-center">
           <Trash2 size={18} className="mr-3 text-rose-500" />
           <span>Hapus Anggota</span>
        </div>
        <div className="p-8 space-y-6">
           <div className="text-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">Akan Dipindahkan Ke Arsip Terhapus</p>
              <p className="text-md font-black uppercase text-slate-900 leading-tight">{member.fullName}</p>
           </div>
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Alasan Penghapusan</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm h-24 resize-none focus:bg-white transition-all outline-none" placeholder="Isi alasan..." required />
           </div>
           <div className="pt-2 space-y-3">
              <button onClick={() => reason.trim() ? onConfirm(reason) : alert("Harap isi alasan!")} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl hover:bg-rose-700 transition-all">Konfirmasi Hapus</button>
              <button onClick={onClose} className="w-full py-3 text-center text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">Batal & Kembali</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const DeathModal: React.FC<{ member: Resident, onClose: () => void, onConfirm: (date: string) => void }> = ({ member, onClose, onConfirm }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in zoom-in-95">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="p-6 bg-slate-900 text-white font-black text-sm uppercase tracking-widest flex items-center">
           <Skull size={18} className="mr-3 text-rose-500" />
           <span>Lapor Kematian</span>
        </div>
        <div className="p-8 space-y-6 text-center">
           <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
              <p className="text-[10px] text-rose-600 font-black uppercase mb-1 tracking-widest">Penduduk Meninggal Dunia</p>
              <p className="text-md font-black uppercase text-slate-900 leading-tight">{member.fullName}</p>
           </div>
           <div className="text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tanggal Wafat</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:bg-white transition-all outline-none" />
           </div>
           <div className="space-y-3">
              <button onClick={() => onConfirm(date)} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl hover:bg-rose-700 transition-all">Simpan Ke Arsip Kematian</button>
              <button onClick={onClose} className="w-full py-3 text-center text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">Batal</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const InternalAddMemberModal: React.FC<{ noKK: string, familyBase: Resident, onClose: () => void, onSave: (r: Resident) => void }> = ({ noKK, familyBase, onClose, onSave }) => {
  const [m, setM] = useState<Omit<Resident, 'id' | 'status'>>({ 
    ...familyBase, nik: '', fullName: '', relationship: '3. Anak Kandung/Tiri', birthDate: '', isHeadOfFamily: false 
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...m, id: `member-${Date.now()}`, status: 'Aktif' as ResidentStatus });
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
       <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
          <div className="p-6 bg-slate-900 text-white font-black text-sm uppercase tracking-widest flex justify-between items-center">
             <span>Tambah Anggota Keluarga</span>
             <button onClick={onClose}><X size={20}/></button>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
             <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">NIK Baru</label><input type="text" value={m.nik} onChange={e => setM({...m, nik: e.target.value.replace(/\D/g, '').slice(0, 16)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold outline-none" required /></div>
                <div className="col-span-2"><label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">Nama Lengkap</label><input type="text" value={m.fullName} onChange={e => setM({...m, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-black uppercase outline-none" required /></div>
                <div><label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">Hubungan</label>
                   <select value={m.relationship} onChange={e => setM({...m, relationship: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold outline-none">
                      <option value="2. Istri">Istri</option>
                      <option value="3. Anak Kandung/Tiri">Anak Kandung/Tiri</option>
                      <option value="9. Lainnya">Lainnya</option>
                   </select>
                </div>
                <div><label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">Tanggal Lahir</label><input type="date" value={m.birthDate} onChange={e => setM({...m, birthDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold outline-none" required/></div>
             </div>
             <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Batal</button>
                <button type="submit" className="px-10 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-emerald-700 transition-all">Simpan</button>
             </div>
          </form>
       </div>
    </div>
  );
};

export default FamilyDetailModal;
