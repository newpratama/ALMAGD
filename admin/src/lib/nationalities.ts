export interface NationalityOption {
  code: string;
  value: string;
  flag: string;
  labelAr: string;
  labelId: string;
  labelEn: string;
  dialCode?: string;
  group: 'frequent' | 'arab' | 'international';
  aliases: string[];
}

export const NATIONALITIES: NationalityOption[] = [
  // ── Most Frequent (Gulf, Yemen & Indonesia) ──
  {
    code: 'SA',
    value: 'Saudi Arabia',
    flag: '🇸🇦',
    labelAr: 'السعودية',
    labelId: 'Arab Saudi',
    labelEn: 'Saudi Arabia',
    dialCode: '+966',
    group: 'frequent',
    aliases: ['saudi', 'saudi arabia', 'ksa', 'arab saudi', 'السعودية', 'سعودي', 'سعوديه', 'المملكة العربية السعودية'],
  },
  {
    code: 'ID',
    value: 'Indonesia',
    flag: '🇮🇩',
    labelAr: 'إندونيسيا',
    labelId: 'Indonesia',
    labelEn: 'Indonesia',
    dialCode: '+62',
    group: 'frequent',
    aliases: ['indonesia', 'indonesian', 'wni', 'إندونيسيا', 'اندونيسيا', 'اندونيسي', 'إندونيسي'],
  },
  {
    code: 'YE',
    value: 'Yemen',
    flag: '🇾🇪',
    labelAr: 'اليمن',
    labelId: 'Yaman',
    labelEn: 'Yemen',
    dialCode: '+967',
    group: 'frequent',
    aliases: ['yemen', 'yemeni', 'yaman', 'اليمن', 'يمني', 'يمنيه'],
  },
  {
    code: 'AE',
    value: 'UAE',
    flag: '🇦🇪',
    labelAr: 'الإمارات',
    labelId: 'Uni Emirat Arab (UAE)',
    labelEn: 'United Arab Emirates',
    dialCode: '+971',
    group: 'frequent',
    aliases: ['uae', 'united arab emirates', 'emirati', 'dubai', 'الإمارات', 'الامارات', 'إماراتي', 'اماراتي'],
  },
  {
    code: 'KW',
    value: 'Kuwait',
    flag: '🇰🇼',
    labelAr: 'الكويت',
    labelId: 'Kuwait',
    labelEn: 'Kuwait',
    dialCode: '+965',
    group: 'frequent',
    aliases: ['kuwait', 'kuwaiti', 'الكويت', 'كويتي'],
  },
  {
    code: 'QA',
    value: 'Qatar',
    flag: '🇶🇦',
    labelAr: 'قطر',
    labelId: 'Qatar',
    labelEn: 'Qatar',
    dialCode: '+974',
    group: 'frequent',
    aliases: ['qatar', 'qatari', 'قطر', 'قطري'],
  },
  {
    code: 'OM',
    value: 'Oman',
    flag: '🇴🇲',
    labelAr: 'سلطنة عُمان',
    labelId: 'Oman',
    labelEn: 'Oman',
    dialCode: '+968',
    group: 'frequent',
    aliases: ['oman', 'omani', 'عمان', 'عُمان', 'سلطنة عمان', 'عماني'],
  },
  {
    code: 'BH',
    value: 'Bahrain',
    flag: '🇧🇭',
    labelAr: 'البحرين',
    labelId: 'Bahrain',
    labelEn: 'Bahrain',
    dialCode: '+973',
    group: 'frequent',
    aliases: ['bahrain', 'bahraini', 'البحرين', 'بحريني'],
  },

  // ── Other Arab Countries ──
  {
    code: 'EG',
    value: 'Egypt',
    flag: '🇪🇬',
    labelAr: 'مصر',
    labelId: 'Mesir (Egypt)',
    labelEn: 'Egypt',
    dialCode: '+20',
    group: 'arab',
    aliases: ['egypt', 'egyptian', 'mesir', 'مصر', 'مصري'],
  },
  {
    code: 'JO',
    value: 'Jordan',
    flag: '🇯🇴',
    labelAr: 'الأردن',
    labelId: 'Yordania (Jordan)',
    labelEn: 'Jordan',
    dialCode: '+962',
    group: 'arab',
    aliases: ['jordan', 'jordanian', 'yordania', 'الأردن', 'الاردن', 'أردني', 'اردني'],
  },
  {
    code: 'IQ',
    value: 'Iraq',
    flag: '🇮🇶',
    labelAr: 'العراق',
    labelId: 'Irak (Iraq)',
    labelEn: 'Iraq',
    dialCode: '+964',
    group: 'arab',
    aliases: ['iraq', 'iraqi', 'irak', 'العراق', 'عراقي'],
  },
  {
    code: 'SY',
    value: 'Syria',
    flag: '🇸🇾',
    labelAr: 'سوريا',
    labelId: 'Suriah (Syria)',
    labelEn: 'Syria',
    dialCode: '+963',
    group: 'arab',
    aliases: ['syria', 'syrian', 'suriah', 'سوريا', 'سوري'],
  },
  {
    code: 'LB',
    value: 'Lebanon',
    flag: '🇱🇧',
    labelAr: 'لبنان',
    labelId: 'Lebanon',
    labelEn: 'Lebanon',
    dialCode: '+961',
    group: 'arab',
    aliases: ['lebanon', 'lebanese', 'لبنان', 'لبناني'],
  },
  {
    code: 'PS',
    value: 'Palestine',
    flag: '🇵🇸',
    labelAr: 'فلسطين',
    labelId: 'Palestina',
    labelEn: 'Palestine',
    dialCode: '+970',
    group: 'arab',
    aliases: ['palestine', 'palestinian', 'palestina', 'فلسطين', 'فلسطيني'],
  },
  {
    code: 'SD',
    value: 'Sudan',
    flag: '🇸🇩',
    labelAr: 'السودان',
    labelId: 'Sudan',
    labelEn: 'Sudan',
    dialCode: '+249',
    group: 'arab',
    aliases: ['sudan', 'sudanese', 'السودان', 'سوداني'],
  },
  {
    code: 'LY',
    value: 'Libya',
    flag: '🇱🇾',
    labelAr: 'ليبيا',
    labelId: 'Libya',
    labelEn: 'Libya',
    dialCode: '+218',
    group: 'arab',
    aliases: ['libya', 'libyan', 'ليبيا', 'ليبي'],
  },
  {
    code: 'MA',
    value: 'Morocco',
    flag: '🇲🇦',
    labelAr: 'المغرب',
    labelId: 'Maroko (Morocco)',
    labelEn: 'Morocco',
    dialCode: '+212',
    group: 'arab',
    aliases: ['morocco', 'moroccan', 'maroko', 'المغرب', 'مغربي'],
  },
  {
    code: 'DZ',
    value: 'Algeria',
    flag: '🇩🇿',
    labelAr: 'الجزائر',
    labelId: 'Aljazair (Algeria)',
    labelEn: 'Algeria',
    dialCode: '+213',
    group: 'arab',
    aliases: ['algeria', 'algerian', 'aljazair', 'الجزائر', 'جزائري'],
  },
  {
    code: 'TN',
    value: 'Tunisia',
    flag: '🇹🇳',
    labelAr: 'تونس',
    labelId: 'Tunisia',
    labelEn: 'Tunisia',
    dialCode: '+216',
    group: 'arab',
    aliases: ['tunisia', 'tunisian', 'تونس', 'تونسي'],
  },
  {
    code: 'MR',
    value: 'Mauritania',
    flag: '🇲🇷',
    labelAr: 'موريتانيا',
    labelId: 'Mauritania',
    labelEn: 'Mauritania',
    dialCode: '+222',
    group: 'arab',
    aliases: ['mauritania', 'mauritanian', 'موريتانيا', 'موريتاني'],
  },
  {
    code: 'SO',
    value: 'Somalia',
    flag: '🇸🇴',
    labelAr: 'الصومال',
    labelId: 'Somalia',
    labelEn: 'Somalia',
    dialCode: '+252',
    group: 'arab',
    aliases: ['somalia', 'somali', 'الصومال', 'صومالي'],
  },
  {
    code: 'DJ',
    value: 'Djibouti',
    flag: '🇩🇯',
    labelAr: 'جيبوتي',
    labelId: 'Djibouti',
    labelEn: 'Djibouti',
    dialCode: '+253',
    group: 'arab',
    aliases: ['djibouti', 'جيبوتي'],
  },
  {
    code: 'KM',
    value: 'Comoros',
    flag: '🇰🇲',
    labelAr: 'جزر القمر',
    labelId: 'Komoro (Comoros)',
    labelEn: 'Comoros',
    dialCode: '+269',
    group: 'arab',
    aliases: ['comoros', 'komoro', 'جزر القمر'],
  },

  // ── Asia & International ──
  {
    code: 'MY',
    value: 'Malaysia',
    flag: '🇲🇾',
    labelAr: 'ماليزيا',
    labelId: 'Malaysia',
    labelEn: 'Malaysia',
    dialCode: '+60',
    group: 'international',
    aliases: ['malaysia', 'malaysian', 'ماليزيا', 'ماليزي'],
  },
  {
    code: 'SG',
    value: 'Singapore',
    flag: '🇸🇬',
    labelAr: 'سنغافورة',
    labelId: 'Singapura',
    labelEn: 'Singapore',
    dialCode: '+65',
    group: 'international',
    aliases: ['singapore', 'singapura', 'سنغافورة'],
  },
  {
    code: 'BN',
    value: 'Brunei',
    flag: '🇧🇳',
    labelAr: 'بروناي',
    labelId: 'Brunei Darussalam',
    labelEn: 'Brunei',
    dialCode: '+673',
    group: 'international',
    aliases: ['brunei', 'بروناي'],
  },
  {
    code: 'TR',
    value: 'Turkey',
    flag: '🇹🇷',
    labelAr: 'تركيا',
    labelId: 'Turki (Turkey)',
    labelEn: 'Turkey',
    dialCode: '+90',
    group: 'international',
    aliases: ['turkey', 'turkish', 'turki', 'تركيا', 'تركي'],
  },
  {
    code: 'PK',
    value: 'Pakistan',
    flag: '🇵🇰',
    labelAr: 'باكستان',
    labelId: 'Pakistan',
    labelEn: 'Pakistan',
    dialCode: '+92',
    group: 'international',
    aliases: ['pakistan', 'pakistani', 'باكستان', 'باكستاني'],
  },
  {
    code: 'IN',
    value: 'India',
    flag: '🇮🇳',
    labelAr: 'الهند',
    labelId: 'India',
    labelEn: 'India',
    dialCode: '+91',
    group: 'international',
    aliases: ['india', 'indian', 'الهند', 'هندي'],
  },
  {
    code: 'CN',
    value: 'China',
    flag: '🇨🇳',
    labelAr: 'الصين',
    labelId: 'Tiongkok (China)',
    labelEn: 'China',
    dialCode: '+86',
    group: 'international',
    aliases: ['china', 'chinese', 'tiongkok', 'الصين', 'صيني'],
  },
  {
    code: 'JP',
    value: 'Japan',
    flag: '🇯🇵',
    labelAr: 'اليابان',
    labelId: 'Jepang (Japan)',
    labelEn: 'Japan',
    dialCode: '+81',
    group: 'international',
    aliases: ['japan', 'japanese', 'jepang', 'اليابان', 'ياباني'],
  },
  {
    code: 'KR',
    value: 'South Korea',
    flag: '🇰🇷',
    labelAr: 'كوريا الجنوبية',
    labelId: 'Korea Selatan',
    labelEn: 'South Korea',
    dialCode: '+82',
    group: 'international',
    aliases: ['korea', 'south korea', 'korean', 'كوريا', 'كوريا الجنوبية'],
  },
  {
    code: 'AU',
    value: 'Australia',
    flag: '🇦🇺',
    labelAr: 'أستراليا',
    labelId: 'Australia',
    labelEn: 'Australia',
    dialCode: '+61',
    group: 'international',
    aliases: ['australia', 'australian', 'أستراليا', 'استراليا'],
  },
  {
    code: 'GB',
    value: 'United Kingdom',
    flag: '🇬🇧',
    labelAr: 'بريطانيا (UK)',
    labelId: 'Inggris (UK)',
    labelEn: 'United Kingdom',
    dialCode: '+44',
    group: 'international',
    aliases: ['uk', 'united kingdom', 'british', 'england', 'inggris', 'بريطانيا', 'بريطاني'],
  },
  {
    code: 'US',
    value: 'United States',
    flag: '🇺🇸',
    labelAr: 'الولايات المتحدة (USA)',
    labelId: 'Amerika Serikat (USA)',
    labelEn: 'United States',
    dialCode: '+1',
    group: 'international',
    aliases: ['usa', 'us', 'united states', 'america', 'american', 'amerika', 'أمريكا', 'امريكا', 'الولايات المتحدة'],
  },
  {
    code: 'DE',
    value: 'Germany',
    flag: '🇩🇪',
    labelAr: 'ألمانيا',
    labelId: 'Jerman (Germany)',
    labelEn: 'Germany',
    dialCode: '+49',
    group: 'international',
    aliases: ['germany', 'german', 'jerman', 'ألمانيا', 'المانيا'],
  },
  {
    code: 'FR',
    value: 'France',
    flag: '🇫🇷',
    labelAr: 'فرنسا',
    labelId: 'Prancis (France)',
    labelEn: 'France',
    dialCode: '+33',
    group: 'international',
    aliases: ['france', 'french', 'prancis', 'فرنسا'],
  },
  {
    code: 'NL',
    value: 'Netherlands',
    flag: '🇳🇱',
    labelAr: 'هولندا',
    labelId: 'Belanda (Netherlands)',
    labelEn: 'Netherlands',
    dialCode: '+31',
    group: 'international',
    aliases: ['netherlands', 'dutch', 'holland', 'belanda', 'هولندا'],
  },
  {
    code: 'RU',
    value: 'Russia',
    flag: '🇷🇺',
    labelAr: 'روسيا',
    labelId: 'Rusia (Russia)',
    labelEn: 'Russia',
    dialCode: '+7',
    group: 'international',
    aliases: ['russia', 'russian', 'rusia', 'روسيا'],
  },
];

export const FREQUENT_NATIONALITIES = NATIONALITIES.filter((n) => n.group === 'frequent');

/**
 * Finds a matching NationalityOption from any stored string (e.g. "saudi", "Saudi Arabia", "السعودية", "ID")
 */
export function findNationalityOption(raw?: string | null): NationalityOption | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return undefined;

  return NATIONALITIES.find(
    (item) =>
      item.value.toLowerCase() === cleaned ||
      item.code.toLowerCase() === cleaned ||
      item.labelAr.toLowerCase() === cleaned ||
      item.labelId.toLowerCase() === cleaned ||
      item.labelEn.toLowerCase() === cleaned ||
      item.aliases.includes(cleaned)
  );
}

/**
 * Formats a stored nationality value into a localized label with flag (e.g. "🇸🇦 السعودية" or "🇸🇦 Arab Saudi")
 */
export function formatNationalityDisplay(
  raw?: string | null,
  lang: 'ar' | 'id' = 'ar',
  includeBilingual = false
): string {
  if (!raw || !raw.trim()) return '—';
  const match = findNationalityOption(raw);
  if (!match) return raw;

  if (includeBilingual) {
    return lang === 'ar'
      ? `${match.flag} ${match.labelAr} (${match.labelEn})`
      : `${match.flag} ${match.labelId} (${match.labelEn})`;
  }

  return lang === 'ar'
    ? `${match.flag} ${match.labelAr}`
    : `${match.flag} ${match.labelId}`;
}
