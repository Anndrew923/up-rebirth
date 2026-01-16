import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase';
import { useUserStore } from '../stores/userStore';
import { useUIStore } from '../stores/uiStore';
import { signInWithCapacitorGoogle } from '../utils/capacitorGoogleAuth';

/**
 * Authentication Hook
 * Handles login, signup, logout, and Google Auth
 * Part of the Rebirth Manifesto: Component Slimming
 */
export const useAuth = () => {
  const [error, setError] = useState(null);
  const setLoading = useUserStore((state) => state.setLoading);
  const setLoadingMessage = useUIStore((state) => state.setLoadingMessage);
  const clearUser = useUserStore((state) => state.clearUser);

  /**
   * Login with email and password
   * Security: Errors are sanitized to prevent information leakage
   */
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      setLoadingMessage('正在登入...');
      
      // Security: Never log sensitive data
      await signInWithEmailAndPassword(auth, email, password);
      
      setLoadingMessage(null);
      setLoading(false);
      return { success: true };
    } catch (err) {
      // Security: Sanitize error messages to prevent information leakage
      const errorMessage = sanitizeAuthError(err);
      setError(errorMessage);
      setLoadingMessage(null);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Signup with email and password
   * Security: Errors are sanitized to prevent information leakage
   */
  const signup = async (email, password, displayName = '') => {
    try {
      setError(null);
      setLoading(true);
      setLoadingMessage('正在註冊...');
      
      // Security: Never log sensitive data
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (displayName && userCredential.user) {
        // Note: updateProfile requires additional Firebase setup
        // This is a placeholder for future implementation
      }
      
      setLoadingMessage(null);
      setLoading(false);
      return { success: true };
    } catch (err) {
      // Security: Sanitize error messages
      const errorMessage = sanitizeAuthError(err);
      setError(errorMessage);
      setLoadingMessage(null);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      setError(null);
      setLoading(true);
      setLoadingMessage('正在登出...');
      
      await signOut(auth);
      clearUser();
      
      setLoadingMessage(null);
      setLoading(false);
      return { success: true };
    } catch (err) {
      const errorMessage = sanitizeAuthError(err);
      setError(errorMessage);
      setLoadingMessage(null);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Send password reset email
   */
  const resetPassword = async (email) => {
    try {
      setError(null);
      setLoadingMessage('正在發送重設密碼郵件...');
      
      await sendPasswordResetEmail(auth, email);
      
      setLoadingMessage(null);
      return { success: true };
    } catch (err) {
      const errorMessage = sanitizeAuthError(err);
      setError(errorMessage);
      setLoadingMessage(null);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Google Sign In
   * Uses Capacitor plugin for native platforms, falls back to web popup
   */
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      setLoadingMessage('正在使用 Google 登入...');
      
      // Check if running on native platform
      const { Capacitor } = await import('@capacitor/core');
      
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Google Auth for native platforms
        try {
          const result = await signInWithCapacitorGoogle();
          if (result.success) {
            setLoadingMessage(null);
            setLoading(false);
            return { success: true };
          } else {
            throw new Error(result.error || 'Google 登入失敗');
          }
        } catch (capacitorError) {
          const errorMessage = sanitizeAuthError(capacitorError);
          setError(errorMessage);
          setLoadingMessage(null);
          setLoading(false);
          return { success: false, error: errorMessage };
        }
      } else {
        // Use Firebase web popup for web platforms
        try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
          setLoadingMessage(null);
          setLoading(false);
          return { success: true };
        } catch (popupError) {
          const errorMessage = sanitizeAuthError(popupError);
          setError(errorMessage);
          setLoadingMessage(null);
          setLoading(false);
          return { success: false, error: errorMessage };
        }
      }
    } catch (err) {
      const errorMessage = sanitizeAuthError(err);
      setError(errorMessage);
      setLoadingMessage(null);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  return {
    login,
    signup,
    logout,
    resetPassword,
    signInWithGoogle,
    error
  };
};

/**
 * Security: Sanitize authentication errors
 * Prevents information leakage about user accounts
 */
const sanitizeAuthError = (error) => {
  // Security: Map Firebase errors to generic messages
  // Never expose specific account information
  const errorCode = error?.code;
  
  switch (errorCode) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      // Security: Don't reveal if email exists or not
      return '電子郵件或密碼不正確';
    case 'auth/email-already-in-use':
      return '此電子郵件已被使用';
    case 'auth/weak-password':
      return '密碼強度不足，請使用至少 6 個字符';
    case 'auth/invalid-email':
      return '電子郵件格式不正確';
    case 'auth/too-many-requests':
      return '請求過於頻繁，請稍後再試';
    case 'auth/network-request-failed':
      return '網路連線失敗，請檢查您的網路';
    case 'auth/popup-closed-by-user':
      return '登入視窗已關閉';
    case 'auth/cancelled-popup-request':
      return '登入已取消';
    default:
      // Security: Generic error message for unknown errors
      return '發生錯誤，請稍後再試';
  }
};
