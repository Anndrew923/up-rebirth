import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { signInWithCredential } from 'firebase/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Capacitor Google Auth Integration
 * Handles native Google Sign-In for mobile platforms
 * Falls back to web popup on non-native platforms
 */
export const initializeCapacitorGoogleAuth = async () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  // If clientId isn't configured, don't attempt any Google init (avoids 400 noise).
  if (!clientId) return { success: false, skipped: true, reason: 'missing-client-id' };

  // Only initialize on native platforms; web uses Firebase popup flow.
  const { Capacitor } = await import('@capacitor/core');
  if (!Capacitor.isNativePlatform()) {
    return { success: false, skipped: true, reason: 'not-native' };
  }

  GoogleAuth.initialize({
    clientId,
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });

  return { success: true };
};

/**
 * Sign in with Google using Capacitor plugin
 * Returns Firebase credential for authentication
 */
export const signInWithCapacitorGoogle = async () => {
  try {
    // Check if running on native platform
    const { Capacitor } = await import('@capacitor/core');
    
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Google Auth for native platforms
      const result = await GoogleAuth.signIn();
      
      if (result && result.authentication) {
        // Create Firebase credential from Google Auth result
        const credential = GoogleAuthProvider.credential(
          result.authentication.idToken,
          result.authentication.accessToken
        );
        
        // Sign in to Firebase
        const userCredential = await signInWithCredential(auth, credential);
        return { success: true, user: userCredential.user };
      }
      
      throw new Error('Google sign-in failed');
    } else {
      // Fallback to web popup for non-native platforms
      // This will be handled by useAuth hook
      throw new Error('Use web Google sign-in for non-native platforms');
    }
  } catch (error) {
    console.error('Capacitor Google Auth error:', error);
    return { 
      success: false, 
      error: error.message || 'Google 登入失敗' 
    };
  }
};

/**
 * Sign out from Google
 */
export const signOutCapacitorGoogle = async () => {
  try {
    const { Capacitor } = await import('@capacitor/core');
    
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }
  } catch (error) {
    console.error('Capacitor Google Sign Out error:', error);
  }
};
