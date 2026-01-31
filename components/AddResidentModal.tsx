
import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Users, Info, AlertCircle } from 'lucide-react';
import { Resident, Gender, MaritalStatus, Education, BloodType } from '../types';

interface AddResidentModalProps {
  onClose: () => void;
  onSave: (newResidents: Resident[]) => void;
}

interface MemberForm {
  nik: string;
  fullName: string;
  relationship: string;
  birthDate: string;
  gender: Gender;
  bloodType: BloodType;
  maritalStatus: MaritalStatus;
  education: Education;
  job: string;
  fatherName: string;
  motherName: string;
}

const AddResidentModal: React.FC<AddResidentModalProps> = ({ onClose, onSave }) => {
  const [familyData, setFamilyData] = useState({
    noKK: '',
    dusun: '',
    rt: '',
    rw: ''
  });

  const [members, setMembers] = useState<MemberForm[]>([
    {
      nik: '',
      fullName: '',
      relationship: '1. Kepala Keluarga',
      birthDate: '',
      gender: '1. Laki-laki' as any,
      bloodType: 'Tidak tahu' as any,
      maritalStatus: '1. Belum kawin' as any,
      education: '5. SLTA/sederajat' as any,
      job: '1. TIDAK BEKERJA',
      fatherName: '',
      motherName: '',
    }
  ]);

  const inputClass = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";

  const RELATIONSHIP_OPTIONS = [
    "1. Kepala Keluarga", "2. Istri", "3. Anak Kandung/Tiri", "4. Anak Angkat", 
    "5. Menantu", "6. Cucu", "7. Orang Tua", "8. Pembantu/Sopir", "9. Lainnya"
  ];

  const GENDER_OPTIONS = ["1. Laki-laki", "2. Perempuan"];
  const BLOOD_OPTIONS = ["A", "AB", "B", "O", "Tidak tahu"];
  const MARITAL_OPTIONS = ["1. Belum kawin", "2. Kawin/Nikah", "3. Cerai hidup", "4. Cerai mati"];
  const EDUCATION_OPTIONS = [
    "1. Tidak/belum pernah sekolah", "2. Tidak/belum tamat SD", "3. SD/sederajat", 
    "4. SLTP/sederajat", "5. SLTA/sederajat", "6. D1", "7. D2", "8. D3", 
    "9. D4/S1", "10. Profesi", "11. S2/S3"
  ];
  const JOB_OPTIONS = [
    "1. TIDAK BEKERJA", "3. Anggota Legislatif", "5. Arsitek/Desainer", "6. Bidan", 
    "7. Buruh di Sektor Jasa (Pariwisata, Transportasi, Hiburan)", "8. Buruh Harian Lepas", 
    "9. Buruh Tani", "10. Dokter", "11. Dosen/Guru", "12. Ibu Rumah Tangga", 
    "13. Karyawan Swasta", "15. Montir", "17. Pegawai di Bidang Keamanan (Polri)", 
    "18. Pegawai di Bidang Keamanan (Satpam)", "20. Pegawai Negeri Sipil", 
    "21. Pekerja Seni (Seniman, Artis, Wartawan)", "22. Pelajar/Mahasiswa", 
    "26. Pengrajin", "27. Pengusaha", "28. Pensiunan", "29. Perawat", 
    "30. Petani", "31. Peternak", "32. Sopir", "33. Tidak Mempunyai Pekerjaan Tetap", 
    "34. Tukang Batu", "35. Tukang Jahit", "36. Tukang Kayu", "37. Tukang Kue", 
    "38. Tukang Listrik", "39. Wirausahawan/Wiraswasta", "40. Perangkat Desa", 
    "41. Lainnya"
  ];

  const addMember = () => {
    setMembers([...members, {
      nik: '',
      fullName: '',
      relationship: '3. Anak Kandung/Tiri',
      birthDate: '',
      gender: '1. Laki-laki' as any,
      bloodType: 'Tidak tahu' as any,
      maritalStatus: '1. Belum kawin' as any,
      education: '1. Tidak/belum pernah sekolah' as any,
      job: '22. Pelajar/Mahasiswa',
      fatherName: '',
      motherName: '',
    }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const handleFamilyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'noKK') finalValue = value.replace(/\D/g, '').slice(0, 16);
    setFamilyData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleMemberChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newMembers = [...members];
    let finalValue = value;
    if (name === 'nik') finalValue = value.replace(/\D/g, '').slice(0, 16);
    newMembers[index] = { ...newMembers[index], [name]: finalValue as any };
    setMembers(newMembers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (familyData.noKK.length !== 16) return alert("Isi Nomor KK dengan benar (16 Digit)");
    
    for (let i = 0; i < members.length; i++) {
      if (members[i].nik.length !== 16) {
        return alert(`NIK Anggota ke-${i+1} (${members[i].fullName || 'Tanpa Nama'}) tidak valid. NIK harus 16 digit.`);
      }
    }

    const timestamp = Date.now();
    const finalResidents: Resident[] = members.map((m, idx) => ({
      ...m,
      ...familyData,
      id: `man-${timestamp}-${idx}`,
      birthPlace: '',
      isHeadOfFamily: m.relationship.startsWith('1'),
      status: 'Aktif'
    }));
    onSave(finalResidents);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
        <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-6">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <Users size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Input Data Satu Keluarga</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Sistem Administrasi Desa Ngumbul</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-all"><X size={28} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-12 bg-slate-50/20 dark:bg-slate-900/50">
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Wilayah & Nomor KK</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">No. KK (16 Digit)</label>
                <div className="relative">
                  <input type="text" name="noKK" value={familyData.noKK} onChange={handleFamilyChange} maxLength={16} className={inputClass} required />
                  {familyData.noKK.length > 0 && familyData.noKK.length < 16 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-amber-500 flex items-center bg-white dark:bg-slate-800">
                       <AlertCircle size={10} className="mr-0.5" /> {familyData.noKK.length}/16
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Dusun</label>
                <input type="text" name="dusun" value={familyData.dusun} onChange={handleFamilyChange} className={inputClass} required />
              </div>
              <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">RT</label>
                   <input type="text" name="rt" value={familyData.rt} onChange={handleFamilyChange} className={`${inputClass} text-center`} required />
                 </div>
                 <div className="flex-1">
                   <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">RW</label>
                   <input type="text" name="rw" value={familyData.rw} onChange={handleFamilyChange} className={`${inputClass} text-center`} required />
                 </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Daftar Anggota</h4>
              </div>
              <button type="button" onClick={addMember} className="flex items-center space-x-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                <Plus size={18} />
                <span>Tambah Jiwa</span>
              </button>
            </div>

            <div className="space-y-6">
              {members.map((member, index) => (
                <div key={index} className="relative bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                  <div className="absolute -left-4 top-8 bg-slate-900 dark:bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-xl">
                    {index + 1}
                  </div>
                  {index > 0 && (
                    <button type="button" onClick={() => removeMember(index)} className="absolute -right-2 -top-2 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                      <Trash2 size={20} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Nama Lengkap</label>
                      <input type="text" name="fullName" value={member.fullName} onChange={(e) => handleMemberChange(index, e)} className={`${inputClass} font-black uppercase`} required />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">NIK (16 Digit)</label>
                      <div className="relative">
                        <input type="text" name="nik" value={member.nik} onChange={(e) => handleMemberChange(index, e)} maxLength={16} className={inputClass} required />
                        {member.nik.length > 0 && member.nik.length < 16 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-amber-500 flex items-center bg-white dark:bg-slate-800">
                             <AlertCircle size={10} className="mr-0.5" /> {member.nik.length}/16
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Hubungan</label>
                      <select name="relationship" value={member.relationship} onChange={(e) => handleMemberChange(index, e)} className={inputClass}>
                        {RELATIONSHIP_OPTIONS.map(o => <option key={o} value={o} className="dark:bg-slate-800">{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">JK</label>
                      <select name="gender" value={member.gender} onChange={(e) => handleMemberChange(index, e)} className={inputClass}>
                        {GENDER_OPTIONS.map(o => <option key={o} value={o} className="dark:bg-slate-800">{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Tgl Lahir</label>
                      <input type="date" name="birthDate" value={member.birthDate} onChange={(e) => handleMemberChange(index, e)} className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Pendidikan</label>
                      <select name="education" value={member.education} onChange={(e) => handleMemberChange(index, e)} className={inputClass}>
                        {EDUCATION_OPTIONS.map(o => <option key={o} value={o} className="dark:bg-slate-800">{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Pekerjaan</label>
                      <select name="job" value={member.job} onChange={(e) => handleMemberChange(index, e)} className={inputClass}>
                        {JOB_OPTIONS.map(o => <option key={o} value={o} className="dark:bg-slate-800">{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </form>

        <div className="p-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-3 text-slate-400">
            <Info size={20} />
            <p className="text-[10px] font-bold uppercase tracking-widest italic">Data akan disimpan secara permanen di database aktif.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button type="button" onClick={onClose} className="px-10 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all uppercase tracking-widest">Batal</button>
            <button type="submit" onClick={handleSubmit} className="px-12 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-[1.5rem] text-sm font-black hover:bg-slate-800 dark:hover:bg-blue-500 shadow-2xl transition-all flex items-center space-x-3">
              <Save size={20} />
              <span>SIMPAN KELUARGA ({members.length} JIWA)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddResidentModal;
