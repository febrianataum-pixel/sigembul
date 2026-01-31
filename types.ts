
export type Gender = 'Laki-laki' | 'Perempuan';
export type MaritalStatus = 'Kawin' | 'Belum Kawin' | 'Cerai Hidup' | 'Cerai Mati';
export type Education = 'Tidak/Belum Sekolah' | 'SD' | 'SMP' | 'SMA' | 'Diploma' | 'Sarjana' | 'Pascasarjana';
export type BloodType = 'A' | 'B' | 'AB' | 'O' | 'Tidak Tahu';
export type ResidentStatus = 'Aktif' | 'Meninggal' | 'Pindah' | 'Terhapus';
export type PregnancyRisk = 'Tinggi' | 'Sedang' | 'Rendah';

export interface Resident {
  id: string;
  dusun: string;
  rt: string;
  rw: string;
  noKK: string;
  nik: string;
  fullName: string;
  relationship: string;
  birthPlace: string;
  birthDate: string;
  gender: Gender;
  bloodType: BloodType;
  maritalStatus: MaritalStatus;
  education: Education;
  job: string;
  fatherName: string;
  motherName: string;
  isHeadOfFamily: boolean;
  status: ResidentStatus;
  deathDate?: string;
  moveDate?: string;
  moveDestination?: string;
  deleteDate?: string;
  deleteReason?: string;
  // Pregnancy Fields
  isPregnant?: boolean;
  pregnancyStartDate?: string;
  pregnancyRisk?: PregnancyRisk;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  enabled: boolean;
}

export interface AppConfig {
  appName: string;
  subtitle: string;
  logoUrl: string;
  operatorName: string;
  villageHeadName: string;
  firebaseConfig?: FirebaseConfig;
}

export type AgeGroup = 
  | '0-1 Bayi' 
  | '1-5 Balita' 
  | '6-12 Anak-anak' 
  | '13-18 Remaja' 
  | '19-30 Dewasa' 
  | '31-45 Dewasa Produktif' 
  | '46-59 Pra Lansia' 
  | '60+ Lansia';
