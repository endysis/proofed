import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
  ICognitoStorage,
} from 'amazon-cognito-identity-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COGNITO_CONFIG } from '../api/cognitoConfig';
import { setAuthTokenGetter } from '../api/client';
import { queryClient } from '../../App';

// Create a synchronous storage wrapper for Cognito
// Uses an in-memory cache that syncs with AsyncStorage
class CognitoAsyncStorage implements ICognitoStorage {
  private dataMemory: Record<string, string> = {};

  setItem(key: string, value: string): string {
    this.dataMemory[key] = value;
    AsyncStorage.setItem(key, value);
    return value;
  }

  getItem(key: string): string | null {
    return this.dataMemory[key] || null;
  }

  removeItem(key: string): boolean {
    delete this.dataMemory[key];
    AsyncStorage.removeItem(key);
    return true;
  }

  clear(): Record<string, string> {
    const data = this.dataMemory;
    this.dataMemory = {};
    AsyncStorage.clear();
    return data;
  }

  async sync(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cognitoKeys = keys.filter((key) => key.startsWith('CognitoIdentityServiceProvider'));
    const pairs = await AsyncStorage.multiGet(cognitoKeys);
    pairs.forEach(([key, value]) => {
      if (value) {
        this.dataMemory[key] = value;
      }
    });
  }
}

const cognitoStorage = new CognitoAsyncStorage();

const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_CONFIG.userPoolId,
  ClientId: COGNITO_CONFIG.userPoolClientId,
  Storage: cognitoStorage,
});

interface AuthUser {
  userId: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentSession = useCallback((): Promise<CognitoUserSession | null> => {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session || !session.isValid()) {
          resolve(null);
          return;
        }
        resolve(session);
      });
    });
  }, []);

  const checkAuthState = useCallback(async () => {
    try {
      // Sync storage from AsyncStorage before checking auth
      await cognitoStorage.sync();

      const session = await getCurrentSession();
      if (session) {
        const idToken = session.getIdToken();
        const payload = idToken.decodePayload();
        setUser({
          userId: payload.sub,
          email: payload.email,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentSession]);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
        Storage: cognitoStorage,
      });

      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session: CognitoUserSession) => {
          // Clear any stale cached data from previous user
          queryClient.clear();
          const idToken = session.getIdToken();
          const payload = idToken.decodePayload();
          setUser({
            userId: payload.sub,
            email: payload.email,
          });
          resolve();
        },
        onFailure: (err: Error) => {
          reject(new Error(err.message || 'Sign in failed'));
        },
      });
    });
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
      ];

      userPool.signUp(email, password, attributeList, [], (err: Error | undefined) => {
        if (err) {
          reject(new Error(err.message || 'Sign up failed'));
          return;
        }
        resolve();
      });
    });
  }, []);

  const confirmSignUp = useCallback(async (email: string, code: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
        Storage: cognitoStorage,
      });

      cognitoUser.confirmRegistration(code, true, (err: Error | undefined) => {
        if (err) {
          reject(new Error(err.message || 'Confirmation failed'));
          return;
        }
        resolve();
      });
    });
  }, []);

  const resendConfirmationCode = useCallback(async (email: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
        Storage: cognitoStorage,
      });

      cognitoUser.resendConfirmationCode((err: Error | undefined) => {
        if (err) {
          reject(new Error(err.message || 'Failed to resend code'));
          return;
        }
        resolve();
      });
    });
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
      }
      // Clear React Query cache to prevent stale data when switching accounts
      queryClient.clear();
      setUser(null);
      resolve();
    });
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
        Storage: cognitoStorage,
      });

      cognitoUser.forgotPassword({
        onSuccess: () => {
          resolve();
        },
        onFailure: (err: Error) => {
          reject(new Error(err.message || 'Password reset failed'));
        },
      });
    });
  }, []);

  const confirmForgotPassword = useCallback(
    async (email: string, code: string, newPassword: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: userPool,
          Storage: cognitoStorage,
        });

        cognitoUser.confirmPassword(code, newPassword, {
          onSuccess: () => {
            resolve();
          },
          onFailure: (err: Error) => {
            reject(new Error(err.message || 'Password reset failed'));
          },
        });
      });
    },
    []
  );

  const deleteAccount = useCallback(async (): Promise<void> => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Call the backend to delete all user data
    const { API_BASE } = await import('../api/config');
    const response = await fetch(`${API_BASE}/account`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete account data');
    }

    // Delete the Cognito user
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) {
        reject(new Error('No user logged in'));
        return;
      }

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          reject(new Error('Failed to get session'));
          return;
        }

        cognitoUser.deleteUser((deleteErr: Error | undefined) => {
          if (deleteErr) {
            reject(new Error(deleteErr.message || 'Failed to delete account'));
            return;
          }
          setUser(null);
          resolve();
        });
      });
    });
  }, []);

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    const session = await getCurrentSession();
    if (!session) {
      return null;
    }
    return session.getIdToken().getJwtToken();
  }, [getCurrentSession]);

  // Set the auth token getter immediately (not in useEffect which runs too late)
  // This ensures the token getter is available before any API calls are made
  setAuthTokenGetter(getAuthToken);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    signOut,
    forgotPassword,
    confirmForgotPassword,
    deleteAccount,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
