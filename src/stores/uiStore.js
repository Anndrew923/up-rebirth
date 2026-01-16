import { create } from 'zustand';

/**
 * UI Store - Manages overlay, loading, and modal states
 * Part of the Rebirth Manifesto: Navigation Immunity
 */
export const useUIStore = create((set) => ({
  // Overlay state
  isOverlayVisible: false,
  
  // Loading state
  loadingMessage: null,
  
  // Active modals tracking
  activeModals: [],
  
  // Actions
  setOverlayVisible: (visible) => set({ isOverlayVisible: visible }),
  
  setLoadingMessage: (message) => set({ 
    loadingMessage: message,
    isOverlayVisible: message !== null 
  }),
  
  openModal: (modalId) => set((state) => ({
    activeModals: [...state.activeModals, modalId],
    isOverlayVisible: true
  })),
  
  closeModal: (modalId) => set((state) => ({
    activeModals: state.activeModals.filter(id => id !== modalId),
    isOverlayVisible: state.activeModals.length > 1
  })),
  
  /**
   * Clear all overlays, loading states, and modals
   * Prevents "ghost masks" during navigation
   */
  clearAllOverlays: () => set({
    isOverlayVisible: false,
    loadingMessage: null,
    activeModals: []
  })
}));
