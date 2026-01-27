
import { AgeGroup } from '../types';

export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const calculatePregnancyAge = (startDate: string) => {
  if (!startDate) return { weeks: 0, days: 0 };
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;
  
  return { weeks, days };
};

export const getAgeGroup = (age: number): AgeGroup => {
  if (age <= 1) return '0-1 Bayi';
  if (age <= 5) return '1-5 Balita';
  if (age <= 12) return '6-12 Anak-anak';
  if (age <= 18) return '13-18 Remaja';
  if (age <= 30) return '19-30 Dewasa';
  if (age <= 45) return '31-45 Dewasa Produktif';
  if (age <= 59) return '46-59 Pra Lansia';
  return '60+ Lansia';
};

export const formatDate = (dateStr: string): string => {
  try {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const downloadTemplate = () => {
  const headers = [
    'Dusun', 'RT', 'RW', 'No.KK', 'NIK', 'Nama Lengkap', 
    'Status Hubungan dalam Keluarga', 'Tanggal Lahir', 'Usia', 'Jenis Kelamin', 
    'Golongan Darah', 'Status Perkawinan', 'Pendidikan Tertinggi', 'Pekerjaan', 
    'Nama Ayah Kandung', 'Nama Ibu Kandung'
  ];
  const example = [
    'Ngumbul Krajan', '01', '01', '3316...', '3316...', 'Slamet Riyadi',
    '1. Kepala Keluarga', '1980-05-05', '44', '1. Laki-laki',
    'O', '2. Kawin/Nikah', '5. SLTA/sederajat', '30. Petani', 'Ayah Kandung', 'Ibu Kandung'
  ];
  
  const csvContent = [headers.join(','), example.join(',')].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'Template_MasterData_SIGA_Ngumbul.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
