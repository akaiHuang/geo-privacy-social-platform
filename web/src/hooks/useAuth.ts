import { useState, useEffect } from 'react';
import AuthService from '../services/auth';
import { User } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

interface AuthFormState {
  authMode: 'email' | 'phone';
  isLogin: boolean;
  email: string;
  password: string;
  username: string;
  displayName: string;
  phoneNumber: string;
  verificationCode: string;
  phoneConfirmation: any;
  authError: string;
  authLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await AuthService.getCurrentUser();
        setState({
          isAuthenticated: true,
          user: userData,
          loading: false,
        });
      } else {
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    });

    return unsubscribe;
  }, []);

  return state;
}

export function useAuthForm() {
  const [formState, setFormState] = useState<AuthFormState>({
    authMode: 'email',
    isLogin: true,
    email: '',
    password: '',
    username: '',
    displayName: '',
    phoneNumber: '',
    verificationCode: '',
    phoneConfirmation: null,
    authError: '',
    authLoading: false,
  });

  const updateField = <K extends keyof AuthFormState>(
    field: K,
    value: AuthFormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormState({
      authMode: 'email',
      isLogin: true,
      email: '',
      password: '',
      username: '',
      displayName: '',
      phoneNumber: '',
      verificationCode: '',
      phoneConfirmation: null,
      authError: '',
      authLoading: false,
    });
  };

  return { formState, updateField, resetForm };
}
