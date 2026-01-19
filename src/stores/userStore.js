import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { validateFitnessData, sanitizeInput } from '../utils/validation';

// ----------------------------
// User Profile Contract (Slice A)
// ----------------------------
// Canonical field names in this app:
// - bodyWeight (kg): canonical bodyweight field (scoring + all assessments)
// - scores: { strength, explosivePower, cardio, muscleMass, bodyFat }
// - rpgStats: nested RPG progression/stats (legacy-compatible)
//
// Backward-compatibility:
// - We still READ legacy fields (weight/bodyweight) from Firestore.
// - We may WRITE legacy aliases during Phase 1 to avoid regressions,
//   but new code should always use `bodyWeight`.
const SENSITIVE_PROFILE_FIELDS = new Set([
  // Verification & entitlement flags MUST NOT be overwritten by generic profile updates.
  'isVerified',
  'verifiedAt',
  'verifiedLadderScore',
  'verificationStatus',
  'verificationExpiredAt',
  'verificationRequestId',
  'subscription',
  'isEarlyAdopter',
]);

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function toIntOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function clampNumber(value, min, max) {
  const n = toNumberOrNull(value);
  if (n === null) return null;
  return Math.min(max, Math.max(min, n));
}

function normalizeGender(value) {
  if (value === 'male' || value === 'female') return value;
  return null;
}

function normalizeScores(input, existingScores) {
  if (!input || typeof input !== 'object') return null;

  const scoreKeys = ['strength', 'explosivePower', 'cardio', 'muscleMass', 'bodyFat'];
  const normalized = {};

  // Legacy key support (defensive)
  const source = {
    ...input,
    ...(input.explosive !== undefined && { explosivePower: input.explosive }),
    ...(input.power !== undefined && { explosivePower: input.power }),
  };

  for (const key of scoreKeys) {
    if (source[key] === undefined) continue;
    const v = clampNumber(source[key], 0, 200);
    if (v === null) continue;
    normalized[key] = v;
  }

  if (Object.keys(normalized).length === 0) return null;
  return {
    ...(existingScores || {}),
    ...normalized,
  };
}

function sanitizeShortText(input, { maxLen }) {
  if (input === null || input === undefined) return null;
  const s = sanitizeInput(String(input));
  if (!s) return '';
  if (s.length > maxLen) {
    return s.slice(0, maxLen);
  }
  return s;
}

/**
 * User Store - Manages user profile, stats, and workout history
 * Synced with Firebase Auth and Firestore
 * Part of the Rebirth Manifesto: Zustand Over Context
 * 
 * Ported from useUserData.js and useHistoryManager.js
 */
export const useUserStore = create((set, get) => ({
  // User state
  userProfile: null,
  stats: null,
  isAuthenticated: false,
  isLoading: true,
  // Auth diagnostics (kept lightweight to avoid console spam)
  authError: null,
  authTokenStatus: 'unknown', // 'unknown' | 'valid' | 'invalid'
  lastTokenRefreshAt: null,
  lastKnownEmailVerified: null,
  
  // Workout history state
  workoutHistory: [],
  oneRMHistory: [],
  isLoadingHistory: false,
  
  // History management constants
  MAX_HISTORY_RECORDS: 50,
  
  // Actions
  setUserProfile: (profile) => set({ userProfile: profile }),
  
  setStats: (stats) => set({ stats }),
  
  setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
  
  setLoading: (loading) => set({ isLoading: loading }),

  setAuthError: (authError) => set({ authError }),
  setAuthTokenStatus: (authTokenStatus) => set({ authTokenStatus }),
  setLastKnownEmailVerified: (lastKnownEmailVerified) =>
    set({ lastKnownEmailVerified }),

  /**
   * Ensure we have a valid Auth token before Firestore operations.
   * - No infinite retry loops
   * - At most 2 attempts (normal -> force refresh)
   */
  ensureValidAuthToken: async () => {
    // In rare cases (especially immediately after auth state flips),
    // Zustand may have userProfile but auth.currentUser isn't set yet.
    // Wait briefly to avoid needless 401/400 noise.
    let firebaseUser = auth.currentUser;
    if (!firebaseUser && (get().isAuthenticated || get().userProfile?.uid)) {
      const start = Date.now();
      while (!firebaseUser && Date.now() - start < 1500) {
        await new Promise((r) => setTimeout(r, 100));
        firebaseUser = auth.currentUser;
      }
    }

    if (!firebaseUser) {
      set({
        authTokenStatus: 'invalid',
        authError: { code: 'auth/no-current-user', message: 'User not authenticated' }
      });
      throw new Error('User not authenticated');
    }

    // Attempt 1: normal token
    try {
      const token = await firebaseUser.getIdToken(false);
      if (!token) throw new Error('Empty token');
      set({
        authTokenStatus: 'valid',
        authError: null,
        lastTokenRefreshAt: Date.now()
      });
      return token;
    } catch {
      // Attempt 2: force refresh once
      try {
        const token = await firebaseUser.getIdToken(true);
        if (!token) throw new Error('Empty token');
        set({
          authTokenStatus: 'valid',
          authError: null,
          lastTokenRefreshAt: Date.now()
        });
        return token;
      } catch (refreshError) {
        set({
          authTokenStatus: 'invalid',
          authError: {
            code: refreshError?.code || 'auth/token-unavailable',
            message: refreshError?.message || 'Auth token unavailable'
          }
        });
        throw refreshError;
      }
    }
  },
  
  /**
   * Clear user data (for logout)
   */
  clearUser: () => set({
    userProfile: null,
    stats: null,
    isAuthenticated: false,
    workoutHistory: [],
    oneRMHistory: []
  }),
  
  /**
   * Initialize auth state listener
   * Syncs Zustand store with Firebase Auth
   */
  initializeAuth: () => {
    // Return unsubscribe function
    return onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const emailVerified =
              typeof firebaseUser.emailVerified === 'boolean'
                ? firebaseUser.emailVerified
                : get().lastKnownEmailVerified;

            // User is signed in
            set({
              userProfile: {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                emailVerified,
                isAnonymous: firebaseUser.isAnonymous === true
              },
              isAuthenticated: true,
              isLoading: true,
              authError: null
            });

            if (typeof emailVerified === 'boolean') {
              set({ lastKnownEmailVerified: emailVerified });
            }

            // Token preflight: prevents noisy 401/400 loops before Firestore calls
            try {
              await get().ensureValidAuthToken();
            } catch {
              // Keep user authenticated, but stop here to avoid spamming failed requests
              set({ isLoading: false });
              return;
            }

            // Load user data from Firestore (guarded & error-handled)
            try {
              await get().loadUserData();
            } catch (loadError) {
              // Avoid console noise; store diagnostics for UI if needed
              set({
                authError: {
                  code: loadError?.code || 'firestore/load-failed',
                  message: loadError?.message || 'Failed to load user data'
                }
              });
            } finally {
              set({ isLoading: false });
            }
          } else {
            // User is signed out
            set({
              userProfile: null,
              stats: null,
              isAuthenticated: false,
              isLoading: false,
              authError: null,
              authTokenStatus: 'unknown',
              lastTokenRefreshAt: null,
              lastKnownEmailVerified: null,
              workoutHistory: [],
              oneRMHistory: []
            });
          }
        } catch (handlerError) {
          // Hard fail-safe: don't loop, don't clear user by default
          set({
            isLoading: false,
            authError: {
              code: handlerError?.code || 'auth/observer-handler-failed',
              message: handlerError?.message || 'Auth observer handler failed'
            }
          });
        }
      },
      (observerError) => {
        // Observer-level error: do NOT retry indefinitely, do NOT clear user state by default
        set({
          isLoading: false,
          authTokenStatus: 'invalid',
          authError: {
            code: observerError?.code || 'auth/observer-error',
            message: observerError?.message || 'Auth observer error'
          }
        });
      }
    );
  },
  
  /**
   * Load user data from Firestore
   * Ported from useUserData.js
   */
  loadUserData: async () => {
    const state = get();
    const uid = state.userProfile?.uid;
    
    if (!uid) {
      console.warn('Cannot load user data: No user ID');
      return;
    }
    
    try {
      set({ isLoading: true });
      
      // Load user stats
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        // Canonical body weight:
        // - Prefer bodyWeight (new)
        // - Fallback to legacy bodyweight/weight
        const bodyWeight =
          toNumberOrNull(userData.bodyWeight) ??
          toNumberOrNull(userData.bodyweight) ??
          toNumberOrNull(userData.weight);

        set({
          stats: {
            // Canonical profile fields
            bodyWeight: bodyWeight,
            height: toNumberOrNull(userData.height),
            age: toIntOrNull(userData.age),
            gender: normalizeGender(userData.gender),
            nickname: sanitizeShortText(userData.nickname ?? userData.displayName, { maxLen: 30 }),
            bio: sanitizeShortText(userData.bio, { maxLen: 500 }),
            avatarUrl: userData.avatarUrl || null,

            // Legacy aliases (read-only / compatibility)
            bodyweight: bodyWeight,
            weight: bodyWeight,

            // Progression / meta
            totalXP: userData.totalXP || 0,
            level: userData.level || 1,
            personalRecords: userData.personalRecords || {},
            settings: userData.settings || {},

            // Legacy nested fields
            scores: userData.scores || {},
            testInputs: userData.testInputs || {},
            rpgStats: userData.rpgStats || userData.rpg_stats || {},
            rpgClass: userData.rpgClass || userData.rpg_class || null,

            // Ladder/verification flags (read-only in Slice A)
            isVerified:
              typeof userData.isVerified === 'boolean' ? userData.isVerified : null,
            lastWeightUpdate: userData.lastWeightUpdate || null,
          }
        });
      } else {
        // Create initial user document
        await setDoc(userDocRef, {
          // Canonical
          bodyWeight: null,
          // Legacy aliases (temporary)
          bodyweight: null,
          weight: null,

          totalXP: 0,
          level: 1,
          personalRecords: {},
          settings: {},
          scores: {},
          testInputs: {},
          rpgStats: {},
          rpgClass: null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error loading user data:', error);
      set({ isLoading: false });
    }
  },
  
  /**
   * Update user stats
   * Ported from useUserData.js with Zero-Trust validation
   * Supports all user profile fields from legacy code
   */
  updateUserStats: async (updates) => {
    const state = get();
    const uid = auth.currentUser?.uid || state.userProfile?.uid;
    
    if (!uid) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Strict token check: ensure Auth token exists before attempting Firestore write
      // Prevents noisy 401/400 failures when token is temporarily unavailable.
      await get().ensureValidAuthToken();

      // Zero-Trust validation
      const sanitizedUpdates = {};

      // Never allow sensitive flags to be mutated via this generic API.
      // (Dedicated admin/verification flows should use a separate action.)
      if (updates && typeof updates === 'object') {
        for (const key of Object.keys(updates)) {
          if (SENSITIVE_PROFILE_FIELDS.has(key)) {
            // Ignore silently (do not throw) to avoid breaking callers.
            continue;
          }
        }
      }
      
      // -----------------------------------
      // Body weight (canonical: bodyWeight)
      // -----------------------------------
      const providedBodyWeight =
        updates?.bodyWeight !== undefined
          ? updates.bodyWeight
          : updates?.bodyweight !== undefined
          ? updates.bodyweight
          : updates?.weight;

      const previousBodyWeight =
        toNumberOrNull(state.stats?.bodyWeight) ??
        toNumberOrNull(state.stats?.bodyweight) ??
        toNumberOrNull(state.stats?.weight);

      let bodyWeightChanged = false;

      if (providedBodyWeight !== undefined) {
        const weight = toNumberOrNull(providedBodyWeight);
        const validation = validateFitnessData({
          type: 'weight',
          value: weight,
          timestamp: Date.now()
        });
        
        if (!validation.valid) {
          throw new Error(validation.error);
        }
        
        sanitizedUpdates.bodyWeight = weight;
        // Transitional aliases (kept until all legacy reads are removed)
        sanitizedUpdates.bodyweight = weight;
        sanitizedUpdates.weight = weight;

        // Track last weight update time (string for compatibility with existing UI)
        const nowIso = new Date().toISOString();
        sanitizedUpdates.lastWeightUpdate =
          typeof updates?.lastWeightUpdate === 'string'
            ? updates.lastWeightUpdate
            : nowIso;

        bodyWeightChanged =
          previousBodyWeight !== null &&
          weight !== null &&
          Math.abs(previousBodyWeight - weight) > 0.01;
      }
      
      // Height validation
      if (updates.height !== undefined) {
        const height = parseFloat(updates.height);
        if (isNaN(height) || height < 50 || height > 300) {
          throw new Error('身高必須在 50 到 300 公分之間');
        }
        sanitizedUpdates.height = height;
      }
      
      // Age validation
      if (updates.age !== undefined) {
        const age = parseInt(updates.age);
        if (isNaN(age) || age < 1 || age > 150) {
          throw new Error('年齡必須在 1 到 150 歲之間');
        }
        sanitizedUpdates.age = age;
      }
      
      // Gender
      if (updates.gender !== undefined) {
        const g = normalizeGender(updates.gender);
        if (g) sanitizedUpdates.gender = g;
      }
      
      // Display name / Nickname
      if (updates.displayName !== undefined) {
        sanitizedUpdates.displayName = sanitizeShortText(updates.displayName, { maxLen: 30 });
        sanitizedUpdates.nickname = sanitizedUpdates.displayName;
      }
      
      if (updates.nickname !== undefined) {
        sanitizedUpdates.nickname = sanitizeShortText(updates.nickname, { maxLen: 30 });
        sanitizedUpdates.displayName = sanitizedUpdates.nickname;
      }
      
      // Bio
      if (updates.bio !== undefined) {
        sanitizedUpdates.bio = sanitizeShortText(updates.bio, { maxLen: 500 });
      }
      
      // Avatar URL
      if (updates.avatarUrl !== undefined) {
        sanitizedUpdates.avatarUrl = updates.avatarUrl;
      }
      
      // Photo URL (Firebase Auth profile photo)
      if (updates.photoURL !== undefined) {
        sanitizedUpdates.photoURL = updates.photoURL;
      }
      
      // RPG Class
      if (updates.rpg_class !== undefined) {
        sanitizedUpdates.rpg_class = sanitizeInput(updates.rpg_class);
      }

      if (updates.rpgClass !== undefined) {
        sanitizedUpdates.rpgClass = sanitizeShortText(updates.rpgClass, { maxLen: 30 });
        sanitizedUpdates.rpg_class = sanitizedUpdates.rpgClass; // legacy alias
      }

      // RPG Stats (nested)
      if (updates.rpgStats !== undefined) {
        if (typeof updates.rpgStats === 'object' && updates.rpgStats !== null) {
          sanitizedUpdates.rpgStats = {
            ...(state.stats?.rpgStats || {}),
            ...updates.rpgStats,
          };
        }
      }
      
      // Scores (fitness scores)
      if (updates.scores !== undefined) {
        const merged = normalizeScores(updates.scores, state.stats?.scores);
        if (merged) sanitizedUpdates.scores = merged;
      }
      
      // Test Inputs (strength test data, etc.)
      if (updates.testInputs !== undefined) {
        // Sanitize test inputs - validate structure but allow nested objects
        const testInputs = updates.testInputs;
        if (typeof testInputs === 'object' && testInputs !== null) {
          sanitizedUpdates.testInputs = {
            ...(state.stats?.testInputs || {}),
            ...testInputs
          };
        }
      }

      // Location / training profile (legacy-compatible; strict-ish validation)
      if (updates.country !== undefined) {
        sanitizedUpdates.country = sanitizeShortText(updates.country, { maxLen: 60 });
      }
      if (updates.region !== undefined) {
        sanitizedUpdates.region = sanitizeShortText(updates.region, { maxLen: 60 });
      }
      if (updates.city !== undefined) {
        sanitizedUpdates.city = sanitizeShortText(updates.city, { maxLen: 60 });
      }
      if (updates.district !== undefined) {
        sanitizedUpdates.district = sanitizeShortText(updates.district, { maxLen: 60 });
      }
      if (updates.job_category !== undefined) {
        sanitizedUpdates.job_category = sanitizeShortText(updates.job_category, { maxLen: 80 });
      }
      if (updates.gym_name !== undefined) {
        sanitizedUpdates.gym_name = sanitizeShortText(updates.gym_name, { maxLen: 120 });
      }
      if (updates.profession !== undefined) {
        sanitizedUpdates.profession = sanitizeShortText(updates.profession, { maxLen: 80 });
      }
      if (updates.weeklyTrainingHours !== undefined) {
        const hours = clampNumber(updates.weeklyTrainingHours, 0, 168);
        if (hours === null) throw new Error('每週訓練時數格式不正確');
        sanitizedUpdates.weeklyTrainingHours = hours;
      }
      if (updates.trainingYears !== undefined) {
        const years = clampNumber(updates.trainingYears, 0, 100);
        if (years === null) throw new Error('訓練年資格式不正確');
        sanitizedUpdates.trainingYears = years;
      }
      if (updates.isAnonymousInLadder !== undefined) {
        sanitizedUpdates.isAnonymousInLadder = updates.isAnonymousInLadder === true;
      }
      if (updates.ladderRank !== undefined) {
        const rank = toIntOrNull(updates.ladderRank);
        if (rank === null || rank < 0) throw new Error('ladderRank 必須是非負整數');
        sanitizedUpdates.ladderRank = rank;
      }
      if (updates.lastLadderSubmission !== undefined) {
        const ts = String(updates.lastLadderSubmission);
        const parsed = Date.parse(ts);
        if (Number.isNaN(parsed)) throw new Error('lastLadderSubmission 必須是可解析的時間字串');
        sanitizedUpdates.lastLadderSubmission = ts;
      }
      
      // History (workout history for backward compatibility)
      if (updates.history !== undefined) {
        // Validate history is an array
        if (Array.isArray(updates.history)) {
          // Limit to MAX_HISTORY_RECORDS
          const maxRecords = get().MAX_HISTORY_RECORDS || 50;
          sanitizedUpdates.history = updates.history.slice(0, maxRecords);
        }
      }
      
      // Ladder Score
      if (updates.ladderScore !== undefined) {
        const score = parseFloat(updates.ladderScore);
        if (!isNaN(score) && score >= 0) {
          sanitizedUpdates.ladderScore = score;
        }
      }
      
      // Total XP and Level
      if (updates.totalXP !== undefined) {
        sanitizedUpdates.totalXP = Math.max(0, updates.totalXP);
      }
      
      if (updates.level !== undefined) {
        sanitizedUpdates.level = Math.max(1, Math.floor(updates.level));
      }
      
      // No-op guard: if nothing survived validation, do nothing (avoid empty writes)
      if (Object.keys(sanitizedUpdates).length === 0) {
        return { success: true };
      }

      // Update Firestore (merge-safe: supports missing doc + avoids accidental overwrites)
      const userDocRef = doc(db, 'users', uid);
      await setDoc(
        userDocRef,
        {
          ...sanitizedUpdates,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
      
      // Update local state
      set({
        stats: {
          ...state.stats,
          ...sanitizedUpdates
        },
        userProfile: {
          ...state.userProfile,
          ...(sanitizedUpdates.displayName && { displayName: sanitizedUpdates.displayName }),
          ...(sanitizedUpdates.photoURL && { photoURL: sanitizedUpdates.photoURL }),
          ...(sanitizedUpdates.avatarUrl && { photoURL: sanitizedUpdates.avatarUrl })
        }
      });

      // Weight Change Notification (store-level, consistent across app)
      // - Non-blocking: notification failures must NOT fail the main update.
      if (bodyWeightChanged) {
        try {
          const newWeight = toNumberOrNull(sanitizedUpdates.bodyWeight);
          if (previousBodyWeight !== null && newWeight !== null) {
            const oldStr = previousBodyWeight.toFixed(1);
            const newStr = newWeight.toFixed(1);
            await addDoc(collection(db, 'notifications'), {
              userId: uid,
              title: '體重已更新',
              message: `你的體重已從 ${oldStr} kg 更新為 ${newStr} kg。建議前往技能樹查看對應的調整建議。`,
              type: 'system',
              read: false,
              createdAt: Timestamp.now(),
              targetPath: '/skill-tree',
              meta: {
                kind: 'weight-change',
                oldWeight: previousBodyWeight,
                newWeight: newWeight,
              },
            });
          }
        } catch {
          // Intentionally silent (rules might block, offline, etc.)
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user stats:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * No-UI Smoke Test (DEV only)
   * Ensures a full profile update can be validated + merged + written to Firestore.
   *
   * Usage (DevTools console):
   *   await useUserStore.getState().smokeTestFullProfileUpdate()
   */
  smokeTestFullProfileUpdate: async () => {
    if (!import.meta.env?.DEV) {
      return { success: false, error: 'smoke test is DEV-only' };
    }

    const uid = auth.currentUser?.uid || get().userProfile?.uid;
    if (!uid) {
      return { success: false, error: 'User not authenticated' };
    }

    const updatePayload = {
      bodyWeight: 72.3,
      height: 178,
      age: 28,
      gender: 'male',
      nickname: 'SmokeTestUser',
      bio: 'Smoke test profile update (no-UI).',
      country: 'TW',
      city: 'Taipei',
      district: 'Xinyi',
      job_category: 'Office',
      gym_name: 'Up Gym',
      weeklyTrainingHours: 6,
      trainingYears: 3,
      rpgClass: 'WARRIOR',
      rpgStats: { xp: 123, level: 4 },
      scores: {
        strength: 61.25,
        explosivePower: 58.5,
        cardio: 70.0,
        muscleMass: 55.0,
        bodyFat: 62.0,
      },
      testInputs: {
        smoke: { ranAt: new Date().toISOString() },
      },
    };

    const writeResult = await get().updateUserStats(updatePayload);
    if (!writeResult.success) return writeResult;

    try {
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        return { success: false, error: 'Smoke test failed: user doc missing after write' };
      }
      const data = snap.data() || {};
      const bw =
        toNumberOrNull(data.bodyWeight) ??
        toNumberOrNull(data.bodyweight) ??
        toNumberOrNull(data.weight);
      if (bw === null) {
        return { success: false, error: 'Smoke test failed: bodyWeight not persisted' };
      }
      return { success: true, persistedBodyWeight: bw };
    } catch (e) {
      return { success: false, error: e?.message || 'Smoke test read-back failed' };
    }
  },
  
  /**
   * Load workout history
   * Ported from useHistoryManager.js
   */
  loadWorkoutHistory: async (limitCount = 50) => {
    const state = get();
    const uid = auth.currentUser?.uid || state.userProfile?.uid;
    
    if (!uid) {
      console.warn('Cannot load workout history: No user ID');
      return;
    }
    
    try {
      set({ isLoadingHistory: true });

      // Token preflight (prevents noisy permission/unauthenticated errors)
      try {
        await get().ensureValidAuthToken();
      } catch {
        set({ isLoadingHistory: false });
        return { success: false, workouts: [], error: 'auth/token-unavailable' };
      }
      
      const workoutsRef = collection(db, 'users', uid, 'workouts');
      const q = query(
        workoutsRef,
        orderBy('date', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const workouts = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        workouts.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate?.() || new Date(data.date)
        });
      });
      
      set({
        workoutHistory: workouts,
        isLoadingHistory: false
      });
      
      return { success: true, workouts };
    } catch (error) {
      const code = error?.code || error?.name || 'unknown';
      const isPermissionIssue =
        code === 'permission-denied' ||
        code === 'unauthenticated' ||
        `${error?.message || ''}`.toLowerCase().includes('missing or insufficient permissions');

      // IMPORTANT: Permission failures are expected under some rulesets (e.g., subcollection reads disabled).
      // Do not spam console with red errors; degrade gracefully.
      if (!isPermissionIssue) {
        console.error('Error loading workout history:', error);
      }

      set({ isLoadingHistory: false, workoutHistory: [] });
      return { success: false, workouts: [], error: isPermissionIssue ? 'permission-denied' : (error?.message || 'unknown') };
    }
  },
  
  /**
   * Add workout to history
   * Ported from useHistoryManager.js with Zero-Trust validation
   * Includes auto-cleanup logic (50 records limit)
   */
  addWorkout: async (workoutData) => {
    const state = get();
    const uid = state.userProfile?.uid;
    
    if (!uid) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Zero-Trust validation
      const validation = validateFitnessData({
        type: workoutData.type || 'workout',
        value: workoutData.totalVolume || 0,
        timestamp: workoutData.date || Date.now()
      });
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Load current history to check limit
      const currentHistory = state.workoutHistory.length > 0 
        ? state.workoutHistory 
        : (await get().loadWorkoutHistory()).workouts || [];
      
      const maxRecords = get().MAX_HISTORY_RECORDS;
      
      // Auto-cleanup: if at limit, remove oldest records
      let historyToSave = currentHistory;
      if (currentHistory.length >= maxRecords) {
        // Sort by date (newest first)
        const sortedHistory = [...currentHistory].sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });
        
        // Keep only the newest (maxRecords - 10) records
        historyToSave = sortedHistory.slice(0, maxRecords - 10);
        
        // Delete old records from Firestore
        const recordsToDelete = sortedHistory.slice(maxRecords - 10);
        for (const record of recordsToDelete) {
          if (record.id) {
            try {
              const recordRef = doc(db, 'users', uid, 'workouts', record.id);
              await deleteDoc(recordRef);
            } catch (deleteError) {
              console.warn('Failed to delete old record:', deleteError);
            }
          }
        }
        
        console.log(`Auto-cleanup: Removed ${recordsToDelete.length} old records`);
      }
      
      // Sanitize input
      const sanitizedWorkout = {
        ...workoutData,
        name: sanitizeInput(workoutData.name || 'Untitled Workout'),
        notes: sanitizeInput(workoutData.notes || ''),
        date: workoutData.date ? Timestamp.fromDate(new Date(workoutData.date)) : Timestamp.now(),
        timestamp: workoutData.timestamp || workoutData.date || new Date().toISOString(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Add to Firestore
      const workoutsRef = collection(db, 'users', uid, 'workouts');
      const docRef = await addDoc(workoutsRef, sanitizedWorkout);
      
      // Update local state
      const newWorkout = {
        id: docRef.id,
        ...sanitizedWorkout,
        date: sanitizedWorkout.date.toDate()
      };
      
      const updatedHistory = [newWorkout, ...historyToSave];
      
      set({
        workoutHistory: updatedHistory
      });
      
      // Also update stats.history for backward compatibility
      await get().updateUserStats({
        history: updatedHistory.map(w => ({
          ...w,
          date: w.date instanceof Date ? w.date.toISOString() : w.date,
          timestamp: w.timestamp || w.date
        }))
      });
      
      return { success: true, workoutId: docRef.id };
    } catch (error) {
      console.error('Error adding workout:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Delete workout history records
   * Zero-Trust validated deletion
   */
  deleteWorkoutHistory: async (recordIds) => {
    const state = get();
    const uid = state.userProfile?.uid;
    
    if (!uid) {
      throw new Error('User not authenticated');
    }
    
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      throw new Error('Invalid record IDs');
    }
    
    try {
      // Delete from Firestore
      const deletePromises = recordIds.map(async (recordId) => {
        if (recordId) {
          const recordRef = doc(db, 'users', uid, 'workouts', recordId);
          await deleteDoc(recordRef);
        }
      });
      
      await Promise.all(deletePromises);
      
      // Update local state
      const updatedHistory = state.workoutHistory.filter(
        record => !recordIds.includes(record.id)
      );
      
      set({
        workoutHistory: updatedHistory
      });
      
      // Also update stats.history for backward compatibility
      await get().updateUserStats({
        history: updatedHistory.map(w => ({
          ...w,
          date: w.date instanceof Date ? w.date.toISOString() : w.date,
          timestamp: w.timestamp || w.date
        }))
      });
      
      return { success: true, deletedCount: recordIds.length };
    } catch (error) {
      console.error('Error deleting workout history:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Load 1RM history
   * Ported from useHistoryManager.js
   */
  load1RMHistory: async (exercise, limitCount = 100) => {
    const state = get();
    const uid = auth.currentUser?.uid || state.userProfile?.uid;
    
    if (!uid) {
      console.warn('Cannot load 1RM history: No user ID');
      return;
    }
    
    try {
      // Token preflight
      try {
        await get().ensureValidAuthToken();
      } catch {
        return { success: false, records: [], error: 'auth/token-unavailable' };
      }

      const oneRMRef = collection(db, 'users', uid, 'oneRM');
      let q = query(
        oneRMRef,
        orderBy('date', 'desc'),
        limit(limitCount)
      );
      
      if (exercise) {
        q = query(
          oneRMRef,
          where('exercise', '==', exercise),
          orderBy('date', 'desc'),
          limit(limitCount)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const oneRMRecords = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        oneRMRecords.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate?.() || new Date(data.date)
        });
      });
      
      set({ oneRMHistory: oneRMRecords });
      
      return { success: true, records: oneRMRecords };
    } catch (error) {
      const code = error?.code || error?.name || 'unknown';
      const isPermissionIssue =
        code === 'permission-denied' ||
        code === 'unauthenticated' ||
        `${error?.message || ''}`.toLowerCase().includes('missing or insufficient permissions');

      if (!isPermissionIssue) {
        console.error('Error loading 1RM history:', error);
      }

      set({ oneRMHistory: [] });
      return { success: false, records: [], error: isPermissionIssue ? 'permission-denied' : (error?.message || 'unknown') };
    }
  },
  
  /**
   * Add 1RM record
   * Ported from useHistoryManager.js with Zero-Trust validation
   */
  add1RMRecord: async (recordData) => {
    const state = get();
    const uid = state.userProfile?.uid;
    
    if (!uid) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Zero-Trust validation
      const validation = validateFitnessData({
        type: '1RM',
        value: recordData.weight,
        timestamp: recordData.date || Date.now()
      });
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Sanitize input
      const sanitizedRecord = {
        exercise: sanitizeInput(recordData.exercise),
        weight: recordData.weight,
        reps: recordData.reps || 1,
        date: recordData.date ? Timestamp.fromDate(new Date(recordData.date)) : Timestamp.now(),
        createdAt: Timestamp.now()
      };
      
      // Add to Firestore
      const oneRMRef = collection(db, 'users', uid, 'oneRM');
      const docRef = await addDoc(oneRMRef, sanitizedRecord);
      
      // Update local state
      const newRecord = {
        id: docRef.id,
        ...sanitizedRecord,
        date: sanitizedRecord.date.toDate()
      };
      
      set({
        oneRMHistory: [newRecord, ...state.oneRMHistory]
      });
      
      return { success: true, recordId: docRef.id };
    } catch (error) {
      console.error('Error adding 1RM record:', error);
      return { success: false, error: error.message };
    }
  }
}));
