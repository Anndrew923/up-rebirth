# Up Rebirth

高績效、安全且視覺精美的健身應用程式 - Rebirth 策略

## 專案架構

### 技術棧
- **框架**: React (Vite)
- **平台**: Capacitor 6 (Mobile)
- **後端**: Firebase (Auth, Firestore)
- **狀態管理**: Zustand
- **樣式**: CSS Modules (嚴格隔離)

### 目錄結構
```
src/
├── stores/          # Zustand stores (userStore, uiStore)
├── hooks/           # 自定義 React hooks
├── components/      # React 組件
└── styles/
    └── modules/     # CSS Modules (*.module.css)
```

## 開發指南

### 安裝依賴
```bash
npm install
```

### 開發模式
```bash
npm run dev
```

### 建置
```bash
npm run build
```

### 環境變數
複製 `.env` 文件並填入您的 Firebase 和 Google Auth 憑證：
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CLIENT_SECRET`

## 核心原則 (Rebirth Manifesto)

1. **Zustand Over Context**: 使用 Zustand stores 作為單一數據源
2. **Magitek Three-Layer Chassis**: 所有佈局遵循三層結構
3. **嚴格樣式隔離**: 僅使用 CSS Modules，設計 tokens 保留在 `index.css` 的 `:root`
4. **導航免疫**: 實現 `useRouteCleanup` hook 確保路由切換時清除 UI 狀態
5. **組件精簡**: 將大型組件重構為小型功能組件和自定義 hooks
