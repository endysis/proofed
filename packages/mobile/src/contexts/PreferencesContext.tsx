import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserPreferences, UpdatePreferencesRequest } from '@proofed/shared';
import { preferencesApi, setPreferencesAuthTokenGetter } from '../api/preferences';
import { useAuth } from './AuthContext';

// Keys for storing pending preference selections (from WelcomeScreen before sign-in)
const PENDING_TEMP_UNIT_KEY = 'proofed_pending_temp_unit';
const PENDING_NAME_KEY = 'proofed_pending_name';

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
  name: string | undefined;
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

      // Check if there are pending preferences from onboarding (WelcomeScreen)
      const pendingTempUnit = await AsyncStorage.getItem(PENDING_TEMP_UNIT_KEY);
      const pendingName = await AsyncStorage.getItem(PENDING_NAME_KEY);

      const pendingUpdates: UpdatePreferencesRequest = {};
      if (pendingTempUnit && (pendingTempUnit === 'F' || pendingTempUnit === 'C')) {
        pendingUpdates.temperatureUnit = pendingTempUnit;
      }
      if (pendingName) {
        pendingUpdates.name = pendingName;
      }

      if (Object.keys(pendingUpdates).length > 0) {
        // Sync the pending preferences to the server
        try {
          const updatedPrefs = await preferencesApi.update(pendingUpdates);
          setPreferences(updatedPrefs);
          // Clear the pending preferences
          await AsyncStorage.multiRemove([PENDING_TEMP_UNIT_KEY, PENDING_NAME_KEY]);
        } catch (syncError) {
          console.error('Failed to sync pending preferences:', syncError);
          // Keep the pending preferences for next time
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
  // Get name (no default - will be undefined if not set)
  const name = preferences?.name;

  const value: PreferencesContextType = {
    preferences,
    isLoading,
    isUpdating,
    hasLoadedOnce,
    updatePreferences,
    refreshPreferences,
    temperatureUnit,
    name,
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
