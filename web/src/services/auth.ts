import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

class AuthService {
  // 註冊
  async register(
    email: string,
    password: string,
    username: string,
    displayName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 更新 Firebase Auth 的 displayName
      await updateProfile(user, { displayName });

      // 在 Firestore 中創建用戶資料
      const userData = {
        id: user.uid,
        username,
        displayName,
        bio: '',
        createdAt: Timestamp.now(),
      };

      // 只有當 avatar 有值時才添加
      await setDoc(doc(db, 'users', user.uid), userData);

      return { success: true };
    } catch (error: any) {
      console.error('註冊失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 登入
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 檢查 Firestore 中是否有用戶資料
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // 如果沒有用戶資料，可能是舊用戶，自動創建
        const userData = {
          id: user.uid,
          username: user.email?.split('@')[0] || `user_${user.uid.slice(0, 8)}`,
          displayName: user.displayName || user.email?.split('@')[0] || '匿名用戶',
          bio: '',
          createdAt: Timestamp.now(),
        };
        await setDoc(doc(db, 'users', user.uid), userData);
      }

      return { success: true };
    } catch (error: any) {
      console.error('登入失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 登出
  async logout(): Promise<void> {
    await signOut(auth);
  }

  // 獲取當前用戶
  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!userDoc.exists()) return null;

    const data = userDoc.data();
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
    } as User;
  }

  // Google 登入
  async loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 檢查用戶是否已存在
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // 新用戶，創建資料
        const userData = {
          id: user.uid,
          username: user.email?.split('@')[0] || `user_${user.uid.slice(0, 8)}`,
          displayName: user.displayName || user.email?.split('@')[0] || '匿名用戶',
          avatar: user.photoURL || undefined,
          bio: '',
          createdAt: Timestamp.now(),
        };

        // 移除 undefined 值
        const cleanData = Object.fromEntries(
          Object.entries(userData).filter(([_, v]) => v !== undefined)
        );

        await setDoc(doc(db, 'users', user.uid), cleanData);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Google 登入失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // Apple 登入
  async loginWithApple(): Promise<{ success: boolean; error?: string }> {
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 檢查用戶是否已存在
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // 新用戶，創建資料
        const userData = {
          id: user.uid,
          username: user.email?.split('@')[0] || `user_${user.uid.slice(0, 8)}`,
          displayName: user.displayName || user.email?.split('@')[0] || '匿名用戶',
          avatar: user.photoURL || undefined,
          bio: '',
          createdAt: Timestamp.now(),
        };

        // 移除 undefined 值
        const cleanData = Object.fromEntries(
          Object.entries(userData).filter(([_, v]) => v !== undefined)
        );

        await setDoc(doc(db, 'users', user.uid), cleanData);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Apple 登入失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 發送手機驗證碼
  async sendPhoneVerification(
    phoneNumber: string,
    recaptchaContainer: string
  ): Promise<{ success: boolean; confirmation?: ConfirmationResult; error?: string }> {
    try {
      // 創建 reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return { success: true, confirmation: confirmationResult };
    } catch (error: any) {
      console.error('發送驗證碼失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 驗證手機號碼並登入
  async verifyPhoneCode(
    confirmation: ConfirmationResult,
    code: string,
    username?: string,
    displayName?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await confirmation.confirm(code);
      const user = result.user;

      // 檢查用戶是否已存在
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // 新用戶，創建資料
        const userData = {
          id: user.uid,
          username: username || user.phoneNumber?.replace(/\D/g, '').slice(-8) || `user_${user.uid.slice(0, 8)}`,
          displayName: displayName || user.phoneNumber || '手機用戶',
          bio: '',
          createdAt: Timestamp.now(),
        };

        await setDoc(doc(db, 'users', user.uid), userData);
      }

      return { success: true };
    } catch (error: any) {
      console.error('驗證碼確認失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 監聽認證狀態變化
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}

export default new AuthService();
