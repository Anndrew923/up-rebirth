import { useEffect, useState } from 'react';
import { useUserStore } from './stores/userStore';
import { useAutoRouteCleanup } from './hooks/useRouteCleanup';
import { MagitekChassis } from './components/layout/MagitekChassis';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { initializeCapacitorGoogleAuth } from './utils/capacitorGoogleAuth';
import styles from './styles/modules/App.module.css';

function App() {
  const [authView, setAuthView] = useState('login'); // 'login' or 'signup'
  const initializeAuth = useUserStore((state) => state.initializeAuth);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const isLoading = useUserStore((state) => state.isLoading);
  const userProfile = useUserStore((state) => state.userProfile);
  
  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initializeAuth();
    
    // Initialize Capacitor Google Auth
    try {
      initializeCapacitorGoogleAuth();
    } catch (error) {
      console.warn('Capacitor Google Auth initialization failed:', error);
    }
    
    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initializeAuth]);
  
  // Navigation defense - auto cleanup on route changes
  useAutoRouteCleanup();

  // Show loading state
  if (isLoading) {
    return (
      <MagitekChassis>
        <div className={styles.app}>
          <div className={styles.card}>
            <p>載入中...</p>
          </div>
        </div>
      </MagitekChassis>
    );
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    return (
      <MagitekChassis>
        {authView === 'login' ? (
          <Login 
            onSwitchToSignup={() => setAuthView('signup')}
            onSuccess={() => {
              // Auth state will be updated automatically via Firebase listener
            }}
          />
        ) : (
          <Signup 
            onSwitchToLogin={() => setAuthView('login')}
            onSuccess={() => {
              // Auth state will be updated automatically via Firebase listener
            }}
          />
        )}
      </MagitekChassis>
    );
  }

  // Show main app when authenticated
  return (
    <MagitekChassis>
      <div className={styles.app}>
        <h1>Up Rebirth</h1>
        <div className={styles.card}>
          <p>歡迎回來, {userProfile?.displayName || userProfile?.email}!</p>
          <p>Magitek Resonance 2.0 Chassis Active</p>
          <p>認證系統已初始化</p>
        </div>
      </div>
    </MagitekChassis>
  );
}

export default App;
