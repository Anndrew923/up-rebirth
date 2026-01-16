import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUserStore } from '../../stores/userStore';
import styles from '../../styles/modules/Signup.module.css';

/**
 * Signup Component
 * Part of the Rebirth Manifesto: Component Slimming
 * Renders inside MagitekChassis ScrollContent layer
 */
export const Signup = ({ onSwitchToLogin, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [validationError, setValidationError] = useState('');
  const { signup, signInWithGoogle, error } = useAuth();
  const isLoading = useUserStore((state) => state.isLoading);

  const validateForm = () => {
    setValidationError('');
    
    if (password.length < 6) {
      setValidationError('密碼長度至少需要 6 個字符');
      return false;
    }
    
    if (password !== confirmPassword) {
      setValidationError('密碼與確認密碼不一致');
      return false;
    }
    
    if (!email.includes('@')) {
      setValidationError('請輸入有效的電子郵件地址');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await signup(email, password, displayName);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupCard}>
        <h1 className={styles.title}>註冊</h1>
        <p className={styles.subtitle}>開始您的健身之旅</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="displayName" className={styles.label}>
              顯示名稱（選填）
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.input}
              placeholder="您的名稱"
              autoComplete="name"
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              電子郵件
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="your@email.com"
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              密碼
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="至少 6 個字符"
              required
              autoComplete="new-password"
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              確認密碼
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              placeholder="再次輸入密碼"
              required
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          {(error || validationError) && (
            <div className={styles.errorMessage} role="alert">
              {error || validationError}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? '註冊中...' : '註冊'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>或</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className={styles.googleButton}
          disabled={isLoading}
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          使用 Google 註冊
        </button>

        {onSwitchToLogin && (
          <p className={styles.switchText}>
            已有帳號？{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className={styles.switchLink}
              disabled={isLoading}
            >
              立即登入
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Signup;
