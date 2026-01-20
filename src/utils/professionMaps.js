// 職業反向映射表（中文 -> Key）
// 用於處理舊數據中的中文職業值，轉換為標準化的 key
export const PROFESSION_REVERSE_MAP = {
  '工程師 (軟體/硬體)': 'engineering',
  工程師: 'engineering',
  '醫療人員 (醫護/藥師)': 'medical',
  醫療人員: 'medical',
  健身教練: 'coach',
  運動教練: 'coach',
  學生: 'student',
  軍警消人員: 'police_military',
  軍警消: 'police_military',
  '商業/金融/法務': 'business',
  '商業/金融': 'business',
  '自由業/設計/藝術': 'freelance',
  '自由業/設計': 'freelance',
  服務業: 'service',
  專業運動員: 'professional_athlete',
  '藝術/表演': 'artist_performer',
  其他: 'other',
};

