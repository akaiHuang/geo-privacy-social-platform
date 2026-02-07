import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

class AuthService {
  /**
   * 註冊新用戶
   */
  async register(
    email: string,
    password: string,
    username: string,
    displayName: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // 創建 Firebase Auth 用戶
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 更新顯示名稱
      await updateProfile(firebaseUser, { displayName });

      // 在 Firestore 中創建用戶資料
      const userData: User = {
        id: firebaseUser.uid,
        username,
        displayName,
        avatar: firebaseUser.photoURL || undefined,
        bio: '',
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: Timestamp.now(),
      });

      return { success: true, user: userData };
    } catch (error: any) {
      console.error('註冊失敗:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  /**
   * 登入
   */
  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 從 Firestore 獲取用戶資料
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('用戶資料不存在');
      }

      const userData = {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: userDoc.data().createdAt.toDate(),
      } as User;

      return { success: true, user: userData };
    } catch (error: any) {
      console.error('登入失敗:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('登出失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取當前用戶
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * 監聽認證狀態變化
   */
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * 更新用戶資料
   */
  async updateUserProfile(
    displayName?: string,
    photoURL?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: '用戶未登入' };
      }

      await updateProfile(user, { displayName, photoURL });
      
      // 同步更新 Firestore
      const updateData: any = {};
      if (displayName) updateData.displayName = displayName;
      if (photoURL) updateData.avatar = photoURL;

      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });

      return { success: true };
    } catch (error: any) {
      console.error('更新用戶資料失敗:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  /**
   * 獲取錯誤訊息
   */
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return '此電子郵件已被使用';
      case 'auth/invalid-email':
        return '無效的電子郵件地址';
      case 'auth/operation-not-allowed':
        return '操作不允許';
      case 'auth/weak-password':
        return '密碼強度不足';
      case 'auth/user-disabled':
        return '此帳號已被停用';
      case 'auth/user-not-found':
        return '找不到此用戶';
      case 'auth/wrong-password':
        return '密碼錯誤';
      case 'auth/too-many-requests':
        return '請求次數過多，請稍後再試';
      default:
        return '發生錯誤，請稍後再試';
    }
  }
}

export default new AuthService();
