import React from 'react';
import { User } from '../types';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  // TODO: 將 App.tsx 的認證邏輯遷移到這裡
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">BroBro</h1>
        <p className="auth-subtitle">連結你的時空與好友</p>
        {/* 認證表單內容 */}
      </div>
    </div>
  );
};
