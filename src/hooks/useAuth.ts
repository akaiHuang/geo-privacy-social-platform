import { useState, useEffect } from 'react';
import AuthService from '../services/auth';
import { User } from '../types';

/**
 * 使用當前認證用戶的 Hook
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 監聽認證狀態變化
    const unsubscribe = AuthService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // 從 Firestore 獲取完整用戶資料
          const result = await AuthService.getCurrentUser();
          if (result) {
            setUser(result as any);
          }
        } catch (err) {
          console.error('獲取用戶資料失敗:', err);
          setError('獲取用戶資料失敗');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await AuthService.login(email, password);
      if (!result.success) {
        setError(result.error || '登入失敗');
        return false;
      }
      return true;
    } catch (err) {
      setError('登入失敗');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await AuthService.register(email, password, username, displayName);
      if (!result.success) {
        setError(result.error || '註冊失敗');
        return false;
      }
      return true;
    } catch (err) {
      setError('註冊失敗');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await AuthService.logout();
      setUser(null);
      return true;
    } catch (err) {
      setError('登出失敗');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
};
