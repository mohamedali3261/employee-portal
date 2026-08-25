export const availableLanguages = [
  { code: 'ar', name: 'العربية', nameEn: 'Arabic' },
  { code: 'en', name: 'English', nameEn: 'English' },
  { code: 'fr', name: 'Français', nameEn: 'French' },
  { code: 'de', name: 'Deutsch', nameEn: 'German' },
  { code: 'es', name: 'Español', nameEn: 'Spanish' },
  { code: 'it', name: 'Italiano', nameEn: 'Italian' },
  { code: 'pt', name: 'Português', nameEn: 'Portuguese' },
  { code: 'ru', name: 'Русский', nameEn: 'Russian' },
  { code: 'zh', name: '中文', nameEn: 'Chinese' },
  { code: 'ja', name: '日本語', nameEn: 'Japanese' },
  { code: 'ko', name: '한국어', nameEn: 'Korean' },
  { code: 'tr', name: 'Türkçe', nameEn: 'Turkish' },
  { code: 'hi', name: 'हिन्दी', nameEn: 'Hindi' },
  { code: 'ur', name: 'اردو', nameEn: 'Urdu' },
  { code: 'fa', name: 'فارسی', nameEn: 'Persian' }
];

export const proficiencyLevels = [
  { value: 'A1', label: 'A1' },
  { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' },
  { value: 'B2', label: 'B2' },
  { value: 'C1', label: 'C1' },
  { value: 'C2', label: 'C2' }
];

export const initialForm = {
  employeeId: '',
  arabicName: '',
  englishName: '',
  jobTitleAr: '',
  jobTitleEn: '',
  department: '',
  phone: '',
  phone2: '',
  email: '',
  address: '',
  sector: '',
  hireDate: '',
  insuranceNumber: '',
  birthdate: '',
  status: 'active',
  notes: '',
  profileImage: null,
  education: '',
  employmentStart: '',
  directManager: '',
  certifications: [],
  category: '',
  languages: [],
  documents: [],
  customFields: {}
};
