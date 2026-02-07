import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase 配置（與 React Native 版本相同）
const firebaseConfig = {
  apiKey: "AIzaSyBT1WDwsMka_JKuBvcYGRV7ZFrAdxJVop8",
  authDomain: "brobro-fd803.firebaseapp.com",
  projectId: "brobro-fd803",
  storageBucket: "brobro-fd803.firebasestorage.app",
  messagingSenderId: "792825622935",
  appId: "1:792825622935:web:fb25f09148ef5c9eec54d2",
  measurementId: "G-746WYX5FZY"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化服務
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Google Maps API Key (從環境變數讀取，如果沒有則使用 Firebase API Key)
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || firebaseConfig.apiKey;

export default app;
