import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
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
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        set({
          userProfile: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified
          },
          isAuthenticated: true,
          isLoading: false
        });
        
        // Load user data from Firestore
        await get().loadUserData();
      } else {
        // User is signed out
        set({
          userProfile: null,
          stats: null,
          isAuthenticated: false,
          isLoading: false,
          workoutHistory: [],
          oneRMHistory: []
        });
      }
    });
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
        set({
          stats: {
            bodyweight: userData.bodyweight || null,
            totalXP: userData.totalXP || 0,
            level: userData.level || 1,
            personalRecords: userData.personalRecords || {},
            settings: userData.settings || {},
            scores: userData.scores || {},
            testInputs: userData.testInputs || {},
            gender: userData.gender || null,
            age: userData.age || null,
            weight: userData.bodyweight || userData.weight || null
          }
        });
      } else {
        // Create initial user document
        await setDoc(userDocRef, {
          bodyweight: null,
          totalXP: 0,
          level: 1,
          personalRecords: {},
          settings: {},
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
    const uid = state.userProfile?.uid;
    
    if (!uid) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Zero-Trust validation
      const sanitizedUpdates = {};
      
      // Bodyweight validation
      if (updates.bodyweight !== undefined || updates.weight !== undefined) {
        const weight = updates.bodyweight !== undefined ? updates.bodyweight : updates.weight;
        const validation = validateFitnessData({
          type: 'weight',
          value: weight,
          timestamp: Date.now()
        });
        
        if (!validation.valid) {
          throw new Error(validation.error);
        }
        
        sanitizedUpdates.bodyweight = weight;
        sanitizedUpdates.weight = weight; // Support both field names
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
        if (['male', 'female'].includes(updates.gender)) {
          sanitizedUpdates.gender = updates.gender;
        }
      }
      
      // Display name / Nickname
      if (updates.displayName !== undefined) {
        sanitizedUpdates.displayName = sanitizeInput(updates.displayName);
        sanitizedUpdates.nickname = sanitizedUpdates.displayName; // Support both
      }
      
      if (updates.nickname !== undefined) {
        sanitizedUpdates.nickname = sanitizeInput(updates.nickname);
        sanitizedUpdates.displayName = sanitizedUpdates.nickname; // Support both
      }
      
      // Bio
      if (updates.bio !== undefined) {
        const sanitizedBio = sanitizeInput(updates.bio);
        if (sanitizedBio.length > 500) {
          throw new Error('個人簡介不能超過 500 字');
        }
        sanitizedUpdates.bio = sanitizedBio;
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
      
      // Scores (fitness scores)
      if (updates.scores !== undefined) {
        // Validate scores object
        const scores = updates.scores;
        const validScores = {};
        const scoreKeys = ['strength', 'explosivePower', 'cardio', 'muscleMass', 'bodyFat'];
        
        scoreKeys.forEach(key => {
          if (scores[key] !== undefined) {
            const score = parseFloat(scores[key]);
            if (!isNaN(score) && score >= 0 && score <= 200) { // Allow scores up to 200 for verified users
              validScores[key] = score;
            }
          }
        });
        
        if (Object.keys(validScores).length > 0) {
          sanitizedUpdates.scores = {
            ...(state.stats?.scores || {}),
            ...validScores
          };
        }
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
      
      // Update Firestore
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, {
        ...sanitizedUpdates,
        updatedAt: Timestamp.now()
      });
      
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
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user stats:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Load workout history
   * Ported from useHistoryManager.js
   */
  loadWorkoutHistory: async (limitCount = 50) => {
    const state = get();
    const uid = state.userProfile?.uid;
    
    if (!uid) {
      console.warn('Cannot load workout history: No user ID');
      return;
    }
    
    try {
      set({ isLoadingHistory: true });
      
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
      console.error('Error loading workout history:', error);
      set({ isLoadingHistory: false });
      return { success: false, error: error.message };
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
    const uid = state.userProfile?.uid;
    
    if (!uid) {
      console.warn('Cannot load 1RM history: No user ID');
      return;
    }
    
    try {
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
      console.error('Error loading 1RM history:', error);
      return { success: false, error: error.message };
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
