import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserPreferences, UpdatePreferencesRequest } from '@proofed/shared';
import { preferencesApi, setPreferencesAuthTokenGetter } from '../api/preferences';
import { useAuth } from './AuthContext';

// Key for storing pending preference selection (from WelcomeScreen before sign-in)
const PENDING_TEMP_UNIT_KEY = 'proofed_pending_temp_unit';

// Extensible defaults - add new preferences here
const DEFAULT_PREFERENCES: Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'> = {
  temperatureUnit: 'F',
  // language: 'en',
  // measurementSystem: 'imperial',
};

interface PreferencesContextType {
  preferences: UserPreferences | null;
  isLoading: boolean;
  isUpdating: boolean;
  hasLoadedOnce: boolean;
  updatePreferences: (prefs: UpdatePreferencesRequest) => Promise<void>;
  refreshPreferences: () => Promise<void>;
  // Convenience getters for common preferences
  temperatureUnit: 'F' | 'C';
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getAuthToken } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Set the auth token getter for the preferences API
  useEffect(() => {
    setPreferencesAuthTokenGetter(getAuthToken);
  }, [getAuthToken]);

  const loadPreferences = useCallback(async () => {
    if (!isAuthenticated) {
      setPreferences(null);
      setHasLoadedOnce(false);
      return;
    }

    setIsLoading(true);
    try {
      // First, load preferences from the server
      const prefs = await preferencesApi.get();
      setPreferences(prefs);
      setHasLoadedOnce(true);

      // Check if there's a pending preference from onboarding (WelcomeScreen)
      const pendingTempUnit = await AsyncStorage.getItem(PENDING_TEMP_UNIT_KEY);
      if (pendingTempUnit && (pendingTempUnit === 'F' || pendingTempUnit === 'C')) {
        // Sync the pending preference to the server
        try {
          const updatedPrefs = await preferencesApi.update({ temperatureUnit: pendingTempUnit });
          setPreferences(updatedPrefs);
          // Clear the pending preference
          await AsyncStorage.removeItem(PENDING_TEMP_UNIT_KEY);
        } catch (syncError) {
          console.error('Failed to sync pending preferences:', syncError);
          // Keep the pending preference for next time
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Don't set hasLoadedOnce on error, allow retry
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load preferences when authenticated
  useEffect(() => {
    if (isAuthenticated && !hasLoadedOnce && !isLoading) {
      loadPreferences();
    }
  }, [isAuthenticated, hasLoadedOnce, isLoading, loadPreferences]);

  // Clear preferences when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setPreferences(null);
      setHasLoadedOnce(false);
    }
  }, [isAuthenticated]);

  const updatePreferences = useCallback(async (updates: UpdatePreferencesRequest) => {
    setIsUpdating(true);
    try {
      const updatedPrefs = await preferencesApi.update(updates);
      setPreferences(updatedPrefs);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const refreshPreferences = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);

  // Get temperature unit with fallback to default
  const temperatureUnit = preferences?.temperatureUnit ?? DEFAULT_PREFERENCES.temperatureUnit;

  const value: PreferencesContextType = {
    preferences,
    isLoading,
    isUpdating,
    hasLoadedOnce,
    updatePreferences,
    refreshPreferences,
    temperatureUnit,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
