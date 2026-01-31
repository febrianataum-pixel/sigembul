
import React, { useState } from 'react';
import { X, Save, User, AlertCircle, HeartPulse, ShieldAlert, ShieldCheck, Stethoscope } from 'lucide-react';
import { Resident, PregnancyRisk } from '../types';

interface EditResidentModalProps {
  resident: Resident;
  onClose: () => void;
  onSave: (updatedResident: Resident) => void;
}

const EditResidentModal: React.FC<EditResidentModalProps> = ({ resident, onClose, onSave }) => {
  const [formData, setFormData] = useState<Resident>({ ...resident });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nik.length !== 16) return alert("NIK harus tepat 16 digit!");
    if (formData.noKK.length !== 16) return alert("Nomor KK harus tepat 16 digit!");
    if (formData.isPregnant && !formData.pregnancyRisk) return alert("Harap pilih klasifikasi resiko kehamilan!");
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    let finalValue = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'nik' || name === 'noKK') {
      finalValue = value.replace(/\D/g, '').slice(0, 16);
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const setRisk = (risk: PregnancyRisk) => {
    setFormData(prev => ({ ...prev, pregnancyRisk: risk }));
  };

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

  const isFemale = formData.gender.includes('Perempuan');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Edit Data Penduduk</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{formData.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        <form id="editForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 bg-slate-50/20">
          
          <div className="space-y-6">
            <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">I. Informasi Wilayah & Dokumen</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Nomor KK (16 Digit)</label>
                <div className="relative">
                  <input type="text" name="noKK" value={formData.noKK} onChange={handleChange} maxLength={16} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" required />
                  {formData.noKK.length > 0 && formData.noKK.length < 16 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-amber-500 flex items-center bg-white pl-1">
                       <AlertCircle size={10} className="mr-0.5" /> {formData.noKK.length}/16
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">NIK (16 Digit)</label>
                <div className="relative">
                  <input type="text" name="nik" value={formData.nik} onChange={handleChange} maxLength={16} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" required />
                  {formData.nik.length > 0 && formData.nik.length < 16 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-amber-500 flex items-center bg-white pl-1">
                       <AlertCircle size={10} className="mr-0.5" /> {formData.nik.length}/16
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Dusun</label>
                <input type="text" name="dusun" value={formData.dusun} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" required />
              </div>
              <div className="flex gap-2">
                 <div className="flex-1">
                   <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">RT</label>
                   <input type="text" name="rt" value={formData.rt} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-center outline-none" required />
                 </div>
                 <div className="flex-1">
                   <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">RW</label>
                   <input type="text" name="rw" value={formData.rw} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-center outline-none" required />
                 </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">II. Biodata Penduduk</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Nama Lengkap</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black uppercase outline-none" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Jenis Kelamin</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none">
                  {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Status Hubungan</label>
                <select name="relationship" value={formData.relationship} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none">
                  {RELATIONSHIP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Tanggal Lahir</label>
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Golongan Darah</label>
                <select name="bloodType" value={formData.bloodType} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none">
                  {BLOOD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Pregnancy Section */}
          {isFemale && (
            <div className="space-y-6">
              <h4 className="text-xs font-black text-pink-600 uppercase tracking-[0.2em] border-b border-pink-100 pb-2 flex items-center">
                <HeartPulse size={14} className="mr-2" /> IV. Status Kehamilan
              </h4>
              <div className="bg-pink-50/50 p-6 rounded-[2rem] border border-pink-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[11px] font-black text-pink-700 uppercase">Apakah Sedang Hamil?</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Aktifkan jika penduduk terdeteksi hamil untuk monitoring KIA</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="isPregnant" 
                      checked={formData.isPregnant} 
                      onChange={handleChange} 
                      className="sr-only peer" 
                    />
                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-pink-500"></div>
                  </label>
                </div>
                
                {formData.isPregnant && (
                  <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div>
                      <label className="block text-[10px] font-black text-pink-700 mb-2 uppercase tracking-widest">Tanggal Mulai Hamil / HPHT</label>
                      <input 
                        type="date" 
                        name="pregnancyStartDate" 
                        value={formData.pregnancyStartDate || ''} 
                        onChange={handleChange} 
                        className="w-full bg-white border border-pink-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-pink-500/10" 
                        required={formData.isPregnant}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-pink-700 mb-1 uppercase tracking-widest">Klasifikasi Resiko (KIA)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button 
                          type="button" 
                          onClick={() => setRisk('Tinggi')}
                          className={`p-4 rounded-2xl border transition-all text-left flex flex-col space-y-1 ${
                            formData.pregnancyRisk === 'Tinggi' 
                              ? 'bg-rose-500 border-rose-600 text-white shadow-lg' 
                              : 'bg-white border-slate-200 text-slate-400 hover:border-rose-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest">Merah</span>
                            <ShieldAlert size={16} />
                          </div>
                          <span className="text-[11px] font-black uppercase">Resiko Tinggi</span>
                          <span className="text-[8px] font-bold opacity-80">Rujukan Rumah Sakit</span>
                        </button>

                        <button 
                          type="button" 
                          onClick={() => setRisk('Sedang')}
                          className={`p-4 rounded-2xl border transition-all text-left flex flex-col space-y-1 ${
                            formData.pregnancyRisk === 'Sedang' 
                              ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-lg' 
                              : 'bg-white border-slate-200 text-slate-400 hover:border-amber-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest">Kuning</span>
                            <Stethoscope size={16} />
                          </div>
                          <span className="text-[11px] font-black uppercase">Resiko Sedang</span>
                          <span className="text-[8px] font-bold opacity-80">Rujukan Puskesmas</span>
                        </button>

                        <button 
                          type="button" 
                          onClick={() => setRisk('Rendah')}
                          className={`p-4 rounded-2xl border transition-all text-left flex flex-col space-y-1 ${
                            formData.pregnancyRisk === 'Rendah' 
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg' 
                              : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest">Hijau</span>
                            <ShieldCheck size={16} />
                          </div>
                          <span className="text-[11px] font-black uppercase">Tanpa Resiko</span>
                          <span className="text-[8px] font-bold opacity-80">Bisa di Puskesmas</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        <div className="p-8 border-t border-slate-200 bg-slate-50 flex justify-end space-x-4">
          <button type="button" onClick={onClose} className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest">Batal</button>
          <button type="submit" form="editForm" className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 shadow-xl transition-all flex items-center space-x-3">
            <Save size={18} />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditResidentModal;
