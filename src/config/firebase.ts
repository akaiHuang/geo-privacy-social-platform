import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase 配置
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

// 僅在 Web 環境初始化 Analytics
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.log('Analytics not available:', error);
  }
}

export { analytics };
export default app;
