// Danh sách các ngân hàng phổ biến hỗ trợ tạo mã VietQR chuẩn NAPAS 247
export const VIETNAM_BANKS = [
  { id: 'MB', name: 'MBBank - Ngân hàng Quân Đội', shortName: 'MB' },
  { id: 'VCB', name: 'Vietcombank - Ngân hàng Ngoại Thương VN', shortName: 'Vietcombank' },
  { id: 'TCB', name: 'Techcombank - Ngân hàng Kỹ Thương VN', shortName: 'Techcombank' },
  { id: 'ICB', name: 'VietinBank - Ngân hàng Công Thương VN', shortName: 'VietinBank' },
  { id: 'BIDV', name: 'BIDV - Ngân hàng Đầu tư & Phát triển VN', shortName: 'BIDV' },
  { id: 'VPB', name: 'VPBank - Ngân hàng Việt Nam Thịnh Vượng', shortName: 'VPBank' },
  { id: 'ACB', name: 'ACB - Ngân hàng Á Châu', shortName: 'ACB' },
  { id: 'TPB', name: 'TPBank - Ngân hàng Tiên Phong', shortName: 'TPBank' },
  { id: 'STB', name: 'Sacombank - Ngân hàng Sài Gòn Thương Tín', shortName: 'Sacombank' },
  { id: 'VBA', name: 'Agribank - Ngân hàng Nông nghiệp & PTNT VN', shortName: 'Agribank' },
  { id: 'HDB', name: 'HDBank - Ngân hàng Phát triển TP.HCM', shortName: 'HDBank' },
  { id: 'VIB', name: 'VIB - Ngân hàng Quốc tế', shortName: 'VIB' },
  { id: 'SHB', name: 'SHB - Ngân hàng Sài Gòn - Hà Nội', shortName: 'SHB' },
  { id: 'MSB', name: 'MSB - Ngân hàng Hàng Hải', shortName: 'MSB' },
  { id: 'OCB', name: 'OCB - Ngân hàng Phương Đông', shortName: 'OCB' },
  { id: 'LPB', name: 'LPBank - Ngân hàng Lộc Phát VN', shortName: 'LPBank' },
];

// Cấu hình ngân hàng mặc định
export const DEFAULT_BANK_CONFIG = {
  bankId: 'MB',
  bankName: 'MBBank - Ngân hàng Quân Đội',
  accountNo: '0908123456',
  accountName: 'TECHPULSE STORE VN',
  template: 'compact2' // 'compact2' hoặc 'qr_only'
};

export function getActiveBankConfig() {
  try {
    const saved = localStorage.getItem('techpulse_bank_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Không thể đọc cấu hình ngân hàng từ localStorage', e);
  }
  return DEFAULT_BANK_CONFIG;
}

export function saveBankConfig(config) {
  try {
    localStorage.setItem('techpulse_bank_config', JSON.stringify(config));
  } catch (e) {
    console.error('Không thể lưu cấu hình ngân hàng', e);
  }
}
